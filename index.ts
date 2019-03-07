#!/usr/bin/env node

import args from './src/lib/arguments';
import { getConfig } from './src/config'

"use strict";



var http = require('http'),
    fs = require('fs'),
    httpProxy = require('http-proxy'),
    stripJson = require('strip-json-comments'),
    program = require('commander')
        .version(require("./package.json").version)
        .option('-c, --config [configurationFile]', 'Set the configuration to use', false)
        .parse(process.argv)
    /**
     * load the given configuration path
     * @param {string} configPath
     */
    ,
    getConfig = function (configPath) {
        return new Promise(function (resolve, reject) {
            fs.readFile(configPath, 'utf-8', function (err, data) {
                if (err) {
                    reject({ title: "Configuration file opening error", err: err, data: { file: configPath } });
                } else {
                    var config = {};
                    try {
                        config = JSON.parse(stripJson(data));
                    } catch (error) {
                        reject({ title: "Configuration JSON  error", err: error, data: { file: configPath } });
                        return;
                    }
                    resolve(config);
                }
            });
        });
    };

/**
 * Main :
 */
if (!program.config) {
    console.log('You need at least to give a config file'.red);
    console.log('See --help to know how');
    process.exit(1);
}

getConfig(program.config)
    .then(function (config) {
        // console.log(config);

        // Create a proxy server with custom application logic
        var proxy = httpProxy.createProxyServer({ ws: true })
            .on('error', function (err) { console.log("Proxy Error : ".red, err); });
        // Create a main server
        http.createServer(function (req, res) {
            try {
                const host = req.headers.host;
                const domain = parseRequest(config, req);

                console.log('Web', host.grey, domain.target.green, req.url);
                proxy.web(req, res, { target: domain.target });
            } catch (err) {
                console.log('Proxy Error', err);
            }
        })
            .on("upgrade", function (req, socket, head) {
                try {
                    const host = req.headers.host;
                    const domain = parseRequest(config, req);

                    console.log('WebSocket', host.grey, domain.target.green);
                    proxy.ws(req, socket, head, { target: domain.target });
                } catch (err) {
                    console.log('Proxy Error', err);
                }
            })
            // .on('proxyReq', function(proxyReq, req, res, options) {
            // 	proxyReq.setHeader('Via', 'Noxy '.program.version);
            // })
            .listen(config.server.port, config.server.hostname);

        console.log('NOXY Server running on', (config.server.hostname ? '' + config.server.hostname : '*').magenta + ':' + ('' + config.server.port).cyan);
    })
    .catch(function (err) {
        console.log("Error".red, err);
    });



function parseRequest(config, req) {
    let domain = config.default;
    const hostLists = Object.keys(config.domains);

    for (let i = 0; i < hostLists.length; i++) {
        let pattern = new RegExp(hostLists[i], 'i');
        if (pattern.test(req.headers.host + req.url)) {
            domain = config.domains[hostLists[i]];
            break;
        }
    }

    if (domain.rm !== undefined) {
        req.url = req.url.replace(domain.rm, "");
    }

    return domain;
}

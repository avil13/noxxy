#!/usr/bin/env node

/*jshint strict:false*/
require('colors');
const url = require('url');
('use strict');

var http = require('http'),
    fs = require('fs'),
    httpProxy = require('http-proxy'),
    stripJson = require('strip-json-comments'),
    program = require('commander')
        .version(require('./package.json').version)
        .option('-c, --config [configurationFile]', 'Set the configuration to use', false)
        .parse(process.argv),
    /**
     * load the given configuration path
     * @param {string} configPath
     */
    getConfig = function(configPath) {
        return new Promise(function(resolve, reject) {
            fs.readFile(configPath, 'utf-8', function(err, data) {
                if (err) {
                    reject({ title: 'Configuration file opening error', err: err, data: { file: configPath } });
                } else {
                    var config = {};
                    try {
                        config = JSON.parse(stripJson(data));
                    } catch (error) {
                        reject({ title: 'Configuration JSON  error', err: error, data: { file: configPath } });
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
    console.log('example ' + 'node noxxy,js -c config.json '.blue);
    console.log('See --help to know how');
    process.exit(1);
}

getConfig(program.config)
    .then(function(config) {
        // Create a proxy server with custom application logic
        var proxy = httpProxy.createProxyServer({ ws: true }).on('error', function(err) {
            console.log('Proxy Error : '.red, err);
        });
        // Create a main server
        http
            .createServer(function(req, res) {
                try {
                    const host = req.headers.host;
                    const domain = parseRequest(config, req);

                    proxy.web(req, res, { target: domain.target });
                    console.log('Web'.bgWhite.blue, host.grey, domain.target.green + '' + req.url);
                    // 
                    proxy.on('proxyReq', function(proxyReq, req, res, options) {
                        const _u = url.parse(domain.target);
                        proxyReq.setHeader('Host', _u.host);
                    });
                } catch (err) {
                    console.log('Proxy Error'.red, err);
                }
            })
            .on('upgrade', function(req, socket, head) {
                try {
                    const host = req.headers.host;
                    const domain = parseRequest(config, req);

                    proxy.ws(req, socket, head, { target: domain.target });
                    console.log('WebSocket'.bgWhite.green, host.grey, domain.target.green);
                } catch (err) {
                    console.log('Proxy Error'.red, err);
                }
            })
            // .on('proxyReq', function(proxyReq, req, res, options) {
            // 	proxyReq.setHeader('Via', 'Noxy '.program.version);
            // })
            .listen(config.server.port, config.server.hostname);
        console.log('NOXXY Server running on'.green, (config.server.hostname ? '' + config.server.hostname : '*').magenta + ':' + ('' + config.server.port).cyan);
    })
    .catch(function(err) {
        console.log('Error'.red, err);
    });

let host_lists = [];
let host_lists_patterns = [];

function parseRequest(config, req) {
    let domain = config.default;

    if (host_lists.length === 0) {
        host_lists = Object.keys(config.domains);
        host_lists_patterns = host_lists.map(v => new RegExp(v, 'i'));
    }

    for (let i = 0; i < host_lists.length; i++) {
        if (host_lists_patterns[i].test(req.headers.host + req.url)) {
            domain = config.domains[host_lists[i]];
            break;
        }
    }

    // if (domain.rm !== undefined) {
    //     req.url = req.url.replace(domain.rm, "");
    // }

    return domain;
}

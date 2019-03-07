const path = require('path');
const fs = require('fs');
const promisify = require('util').promisify;

const stripJson = require('strip-json-comments');
const readFile = promisify(fs.readFile);

// # # # # # #

const configFile = path.join(process.cwd(), 'config.json');
var _config: any;

/**
 * check to exists config file
 */
const checkExists = () => {
    const stats = fs.statSync(configFile);
    return stats.isFile();
};

const getConfig = async (key?: string): Promise<any | number | string> => {
    // check
    if (!checkExists()) {
        throw new Error(`Can't find config file`);
    }

    if (!_config) {
        try {
            const configFileData = await readFile(configFile, 'utf-8');
            _config = JSON.parse(stripJson(configFileData));
        } catch (e) {
            console.error(`Can't read file: "${configFile}"`);
            console.error(e);
        }
    }

    //
    if (key) {
        return _config[key];
    }

    return _config;
};


export {
    checkExists,
    getConfig
};

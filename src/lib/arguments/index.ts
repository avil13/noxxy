


const args = require('commander')
    .version(require('./package.json').version)
    .option('-c, --config [configurationFile]', 'Set the configuration to use, default in current folder "config.json"', false)
    .parse(process.argv);


export default args;



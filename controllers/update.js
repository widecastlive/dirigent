const exec = require('util').promisify(require('child_process').exec);

module.exports = async () => {
    await exec(`cd /home/dirigent && git pull && yarn install`).catch(console.error);
};
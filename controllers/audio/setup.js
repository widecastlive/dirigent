const exec = require('util').promisify(require('child_process').exec);
const client = require('../../services/client');

module.exports = {
    fetch: {
        all: async () => {
            console.log('Fetch config');
            return client.post('/config', {});
        },
        liquidsoap: async (home) => {
            // fetch config file, replace existing
            console.log('Fetch liquidsoap config');
            const config = await client.post('/config', { config: ['liquidsoap'] });
            if (!config.data) return;

            await exec(`cp ${home}/live.liq ${home}/live.bck.liq 2>/dev/null || :`);
            return require('fs').writeFileSync(`${home}/live.liq`, config.data);
        },
        credentials: async () => {
            return client.get('/credentials').then(res => res.data);
        }
    }
};
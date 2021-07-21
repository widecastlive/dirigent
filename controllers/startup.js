const _ = require('lodash');

const common = require('../services/common');
const state = require('../services/state');

const { ws, send } = require('../services/ws').socket;

const [
    messages,
    status,
    config,
    sync
] = [
    require('./messages'),
    require('./status'),
    require('./config'),
    require('./sync')
];

const startup = async () => {
    // container checkup
    const containers = await status.docker();
    if (!Array.isArray(containers) || containers.length === 0) {
        // no containers running, run full config
        await config.fetch.liquidsoap();
        await config.compose.start();
        send('status', { ready: true });
    }

    status.monitor();
    sync();

    state.intervals.push(setInterval(async () => {
        const data = state.get('status:prometheus');
        send('status', { container: 'prometheus', data });
    }, 1000 * 60 * 5)); //5min

    ws().on('message', data => {
        if (common.isJson(data)) data = JSON.parse(data);
        if (messages[data.action]) return messages[data.action](data.data);
    });
};

startup();

state.emitter.on('set:status:container:liquidsoap', (key, [oldValue, newValue]) => {
    //console.log(key, [oldValue, newValue]);
    if (!oldValue) {
        //console.log('Liquidsoap running status', newValue.state.Running);
        return send('status', { service: "liquidsoap", running: newValue.state.Running });
    };
    if (oldValue.state.Status !== newValue.state.Status) {
        //console.log('Liquidsoap running status changed', oldValue.state.Running, newValue.state.Running);
        return send('status', { service: "liquidsoap", running: newValue.state.Running });
    }
});

state.emitter.on('set:status:prometheus', (key, [oldValue, newValue]) => {
    if (!_.isEqual(newValue, oldValue)) send('status', { service: "prometheus", status: newValue });
});
// main.js
'use strict';


const utils = require('@iobroker/adapter-core');
const { createClient } = require('./lib/api');


let adapter;


function startAdapter(options) {
options = options || {};


adapter = new utils.Adapter(Object.assign({}, options, {
name: 'apsystems-ez1'
}));


adapter.on('ready', main);
adapter.on('stateChange', (id, state) => {
if (!state || state.ack) return;
// handle writes
if (id.endsWith('control.maxPower')) {
const v = state.val;
const api = getApi();
api.get(`/setMaxPower?p=${encodeURIComponent(v)}`).then(() => {
adapter.log.info(`Set maxPower => ${v}`);
}).catch(err => adapter.log.error('setMaxPower error: ' + err));
}
if (id.endsWith('control.onOff')) {
const v = state.val;
const api = getApi();
api.get(`/setOnOff?status=${encodeURIComponent(v)}`).then(() => {
adapter.log.info(`Set onOff => ${v}`);
}).catch(err => adapter.log.error('setOnOff error: ' + err));
}
});


return adapter;
}


function getApi() {
const cfg = adapter.config || adapter.native || {};
const ip = cfg.deviceIp || '192.168.1.50';
const port = cfg.port || 8050;
const timeout = Number(cfg.httpTimeout) || 5000;
const retries = Number(cfg.httpRetries) || 2;
return createClient({ ip, port, timeout, retries });
}


async function safeGet(path) {
try {
const api = getApi();
const res = await api.get(path);
return res;
} catch (err) {
adapter.log.warn(`HTTP ${path} failed: ${err.message || err}`);
return null;
}
}


function ensureState(id, common) {
return new Promise(resolve => {
adapter.getObject(id, (err, obj) => {
if (!obj) {
adapter.setObjectNotExists(id, { type: 'state', common }, () => resolve());
} else {
resolve();
}
});
});
}


async function createDpTree() {
await ensureState('info.deviceId', { name: 'Device ID', type: 'string', role: 'info' });
await ensureState('info.version', { name: 'Version', type: 'string', role: 'info' });
await ensureState('output.p1', { name: 'P1', type: 'number', role: 'value.power' });
await ensureState('output.p2', { name: 'P2', type: 'number', role: 'value.power' });
await ensureState('output.e1', { name: 'E1', type: 'number', role: 'value.energy' });
await ensureState('output.e2', { name: 'E2', type: 'number', role: 'value.energy' });
await ensureState('output.te1', { name: 'TE1', type: 'number', role: 'value.energy' });
await ensureState('output.te2', { name: 'TE2', type: 'number', role: 'value.energy' });
await ensureState('control.maxPower', { name: 'Max Power', type: 'number', role: 'level', write: true });
await ensureState('control.onOff', { name: 'On/Off', type: 'number', role: 'switch', write: true });
await ensureState('alarm.offGrid', { name: 'Off Grid', type: 'number', role: 'indicator' });
}
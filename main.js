"use strict";

const utils = require("@iobroker/adapter-core");
const { createClient } = require("./lib/api");
const nodemailer = require("nodemailer");

class ApsystemsEz1 extends utils.Adapter {
    constructor(options) {
        super({ ...options, name: "apsystems-ez1" });
        this.pollTimer = null;
        this.errorCounts = {};
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }

    getConfig() {
        return this.config || this.native || {};
    }

    getApiForDevice(dev) {
        const cfg = this.getConfig();
        const timeout = Number(cfg.httpTimeout || 5000);
        const retries = Number(cfg.httpRetries || 2);
        return createClient({ ip: dev.ip, port: cfg.port || 8050, timeout, retries });
    }

    async safeGet(api, path, label) { /* 来自 main1.js 的逻辑 */ }
    async normalGet(api, path, label) { /* 来自 main1.js 的逻辑 */ }
    sendAlert(message) { /* 来自 main1.js 的逻辑 */ }

    async createStatesForDevice(prefix) { /* 来自 main1.js 的逻辑 */ }
    async updateStatesForDevice(prefix, info, output, maxp, alarm, onoff) { /* 来自 main1.js 的逻辑 */ }

    async pollDevice(dev) { /* 来自 main1.js 的逻辑 */ }

    async onReady() {
        this.log.info("APsystems EZ1 adapter ready");
        const cfg = this.getConfig();
        let devices = [];
        if (Array.isArray(cfg.devices) && cfg.devices.length) {
            devices = cfg.devices.map(d => ({ name: d.name || d.ip, ip: d.ip }));
        } else if (cfg.deviceIp) {
            devices = [{ name: "EZ1", ip: cfg.deviceIp }];
        } else {
            devices = [{ name: "EZ1", ip: "192.168.178.25" }];
        }

        for (const dev of devices) {
            await this.createStatesForDevice(`devices.${dev.name}`);
        }
        this.subscribeStates("apsystems-ez1.0.*.control.*");

        const interval = Number(cfg.pollInterval || 30) * 1000;
        for (const dev of devices) {
            await this.pollDevice(dev);
        }
        this.pollTimer = setInterval(async () => {
            for (const dev of devices) {
                await this.pollDevice(dev);
            }
        }, interval);
    }

    async onStateChange(id, state) { /* 来自 main1.js 的逻辑 */ }

    onUnload(callback) {
        try {
            if (this.pollTimer) clearInterval(this.pollTimer);
            callback();
        } catch (e) {
            callback();
        }
    }
}

if (require.main !== module) {
    module.exports = options => new ApsystemsEz1(options);
} else {
    new ApsystemsEz1();
}


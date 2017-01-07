'use strict';

const pluginEvents = require('plugin/events');

class PluginEventInterface {
    constructor(name) {
        this._name = name;
    }

    bind(event, handler) {
        pluginEvents.addEventListener(event, this._name, handler);
    }
}

module.exports = PluginEventInterface;
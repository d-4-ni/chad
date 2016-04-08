'use strict';

const tmi = require('tmi.js');
const settings = require('./../settings');
const events = require('./events');

const ChatChannel = require('./channel');
const ObjectTools = require('../tools/object');
const ArrayTools = require('../tools/array');

const ChatConnectionError = require('../error/chat-connection');
const SettingsMissingError = require('../error/settings-missing');

class ChatConnection {
    constructor() {
        this._client = undefined;
        this._config = settings.get('connection') || {};
        let channelNames = this._config.channels || [];
        this._channels = ObjectTools.combine(channelNames, channelNames.map(name => ChatChannel.get(name)));

        settings.watch('connection.channels', () => {
            let newChannelNames = settings.get('connection.channels');
            let oldChannelNames = Object.keys(this._channels);
            let addedChannelNames = ArrayTools.diff(newChannelNames, oldChannelNames);
            let removedChannelNames = ArrayTools.diff(oldChannelNames, newChannelNames);

            for (let channel of addedChannelNames) {
                this._channels[channel] = ChatChannel.get(channel);
                this._client.join('#' + channel);
            }
            
            for (let channel of removedChannelNames) {
                this._client.part('#' + channel);
                this._channels[channel].destroy();
                delete this._channels[channel];
            }
        });
    }

    connect() {
        return new Promise((resolve, reject) => {
            this._config = settings.get('connection') || {};
            if (this._config && this._config.username && this._config.token) {
                if (this._client) {
                    this._client.disconnect();
                }
                let _client = this._client = new tmi.client({
                    debug: true,
                    connection: {
                        cluster: 'aws',
                        reconnect: true
                    },
                    identity: {
                        username: this._config.username,
                        password: this._config.token
                    },
                    channels: (this._config.channels || []).map(channel => '#' + channel)
                });
                let forwardEvent = function(eventName) {
                    _client.on(eventName, events.emit.bind(events, eventName));
                };
                forwardEvent('chat');
                forwardEvent('action');
                _client.connect().then(resolve, err => {
                    reject(new ChatConnectionError(err));
                });
            }
            else {
                reject(new SettingsMissingError);
            }
        });
    }

    say(...args) {
        return this._client.say(...args);
    }
}

module.exports = new ChatConnection();
'use strict';

const {EventEmitter} = require('events');

const twitchAPIRequest = require('request/twitchAPI').request;
const request = require('request');
const cache = require('settings/cache');

let channels = {};

class ChatChannel {
    constructor(name) {
        this._name = name.replace(/^#/, '');
        this._joined = true;
        this._displayName = name;
        this._element = undefined;

        /**
         * @type {Object}
         * @property {number} _id
         */
        this._channelData = undefined;

        this._bttvEmotes = {};
        this._channelLogo = 'img/default-user.svg';
        this._gameName = '';
        this._statusText = '';
        this._online = undefined;
        this._updateTimer = undefined;
        this._updateInterval = 10;
        this._internalEvents = new EventEmitter();
        this.initData();
    }

    on(...args) {
        this._internalEvents.on(...args);
    }

    off(...args) {
        this._internalEvents.removeListener(...args);
    }

    initData() {
        this._setData(cache.get(`channel:${this._name}`), true);
        this.updateData();
        this.startAutoUpdate();
        this.updateBttvData();
    }

    startAutoUpdate() {
        if (this._updateTimer) {
            clearInterval(this._updateTimer);
        }
        this._updateTimer = setInterval(() => this.updateData(), this._updateInterval * 60 * 1000);
    }

    _setData(data, fromCache = false) {
        if (data) {
            this._channelData = data;
            this._channelLogo = data.logo || this._channelLogo;
            this._displayName = data.display_name || this._name;
            this._gameName = data.game || '';
            this._statusText = data.status || '';

            if (!fromCache) {
                cache.set(`channel:${this._name}`, data);
            }
        }
    }

    updateData() {
        twitchAPIRequest(`https://api.twitch.tv/kraken/streams/${this._name}`).then(data => {
            let oldOnline = this._online;

            if (!data.stream) {
                this._online = false;

                twitchAPIRequest(`https://api.twitch.tv/kraken/channels/${this._name}`).then(data => {
                    if (typeof data === 'object') {
                        this._setData(data);
                        this._internalEvents.emit('updated');
                    }
                });
            }
            else if (typeof data === 'object') {
                this._online = true;
                this._setData(data.stream.channel);
                this._internalEvents.emit('updated');
            }

            if (oldOnline === false && this._online) {
                this._internalEvents.emit('online');
            }
        });
    }

    updateBttvData() {
        request(`https://api.betterttv.net/2/channels/${this._name}`, (err, res, data) => {
            if (!err && res.statusCode === 200) {
                data = JSON.parse(data);
                this._bttvEmotes = {};
                for (let emote of data.emotes) {
                    this._bttvEmotes[emote.code] = emote;
                }
            }
        });
    }

    get name() {
        return this._name;
    }

    get ircName() {
        return '#' + this.name;
    }

    get bttvEmotes() {
        return this._bttvEmotes;
    }

    get isJoined() {
        return this._joined;
    }

    join() {
        return new Promise((resolve, reject) => {
            const chatInterface = require('chat/connection').chatInterface;
            if (this._joined) {
                resolve();
                return;
            }
            const myResolve = () => {
                this._joined = true;
                resolve();
            };
            chatInterface.join(this._name).then(myResolve, () => {
                // twitch is weird here, check if we joined even though we got an error
                if (chatInterface.getChannels().includes(this.ircName)) {
                    myResolve();
                }
                else {
                    // check again in a second
                    setTimeout(() => {
                        if (chatInterface.getChannels().includes(this.ircName)) {
                            myResolve();
                        }
                        else {
                            // all hope is lost
                            reject();
                        }
                    }, 1000);
                }
            });
        });
    }

    leave() {
        this._internalEvents.emit('leaving');
        return require('chat/connection').chatInterface.part(this._name).then(() =>  {
            this._joined = false;
        });
    }

    say(message) {
        return require('chat/connection').chatInterface.say(this._name, message);
    }
}

module.exports = ChatChannel;
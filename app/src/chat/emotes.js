'use strict';

const channelManager = require('chat/channelManager');
const chatEvents = require('chat/events');

const ArrayTools = require('tools/array');
const ObjectTools = require('tools/object');

const RegexDictionary = require('regex/dictionary');
const htmlEntities = new require('html-entities').AllHtmlEntities;

const request = require('request');
const merge = require('merge');

class ChatEmotes {
    constructor() {
        this._ownTwitchEmotes = {};
        this._ownTwitchEmoteSetMap = {};
        this._globalBttvEmotes = {};
        this._twitchEmoteSetNames = {};
        this.init();
    }

    init() {
        let _this = this;

        chatEvents.on('emotesets', (_, emoteSets) => {
            _this._ownTwitchEmotes = {};

            for (let emoteSet in emoteSets) {
                if (emoteSets.hasOwnProperty(emoteSet)) {
                    _this._ownTwitchEmoteSetMap[emoteSet] = [];
                    for (let emote of emoteSets[emoteSet]) {
                        emote.set = emoteSet;
                        for (let emoteName of RegexDictionary.getAllMatches(emote.code)) {
                            emoteName = htmlEntities.decode(emoteName);
                            if (emoteName in _this._ownTwitchEmotes) {
                                let oldSet = _this._ownTwitchEmotes[emoteName].set;
                                ArrayTools.removeItem(_this._ownTwitchEmoteSetMap[oldSet], emoteName);
                            }
                            _this._ownTwitchEmotes[emoteName] = emote;
                            _this._ownTwitchEmoteSetMap[emoteSet].push(emoteName);
                        }
                    }
                }
            }
        });

        request('https://api.betterttv.net/2/emotes', (error, res, data) => {
            if (!error && res.statusCode === 200) {
                data = JSON.parse(data);
                let emotes = data.emotes.filter(emote => !emote.restrictions.emoticonSet);
                _this._globalBttvEmotes = ObjectTools.combine(emotes.map(emote => emote.code), emotes);
            }
        });

        request('https://api.betterttv.net/2/emotes/sets', (error, res, data) => {
            if (!error && res.statusCode === 200) {
                data = JSON.parse(data);
                _this._twitchEmoteSetNames = data.sets;
            }
        });
    }

    getOwnTwitchEmotes() {
        return this._ownTwitchEmotes;
    }

    getOwnTwitchEmoteSetMap() {
        return this._ownTwitchEmoteSetMap;
    }

    getBttvEmotes(channelName) {
        return merge(true, this.getGlobalBttvEmotes(), this.getChannelBttvEmotes(channelName));
    }

    getGlobalBttvEmotes() {
        return this._globalBttvEmotes;
    }

    //noinspection JSMethodCanBeStatic
    getChannelBttvEmotes(channelName) {
        return channelManager.get(channelName).bttvEmotes;
    }

    getEmoteSetName(emoteSet) {
        let name = this._twitchEmoteSetNames[emoteSet];

        if (emoteSet === '19194') {
            // twitch API doesn't help us here :( so we'll just hardcode this one...
            name = 'Turbo/Prime';
        }
        else if (name) {
            if (name === '--hidden--') {
                name = null;
            }
            else if (name === '--twitch-turbo--') {
                name = 'Turbo/Prime';
            }
        }

        return name;
    }
}

module.exports = new ChatEmotes;
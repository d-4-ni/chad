'use strict';

const Token = require('regex/token');

class CharacterToken extends Token {
    constructor(character) {
        super();
        this._literalValue = character;
    }

    get literalValue() {
        return this._literalValue;
    }
}

module.exports = CharacterToken;
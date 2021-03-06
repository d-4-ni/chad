'use strict';

const Token = require('regex/token');

class OpenGroupToken extends Token {
    constructor(currentDepth) {
        super();
        this._currentDepth = currentDepth;
    }
    
    get currentDepth() {
        return this._currentDepth;
    }
    
    get literalValue() {
        return '(';
    }
}

module.exports = OpenGroupToken;
'use strict';

class ObjectTools {
    static combine(keys, vals) {
        return keys.length === vals.length ? keys.reduce(function(obj, key, index) {
            obj[key] = vals[index];
            return obj;
        }, {}) : null;
    }

    static map(obj, fn) {
        return Object.assign(...Object.entries(obj).map(([key, value]) => ({[key]: fn(value)})));
    }

    /**
     * Filters an object by a given predicate
     * @param {Object.<K, V>} obj
     * @param {function(V, K)} fn
     * @return {Object.<K, V>}
     * @template K, V
     */
    static filter(obj, fn) {
        return Object.assign({}, ...Object.entries(obj).filter(([key, value]) => fn(value, key)).map(([key, value]) => ({[key]: value})));
    }

    static isEmpty(o) {
        return Object.getOwnPropertyNames(o).length === 0;
    }
}

module.exports = ObjectTools;
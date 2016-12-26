'use strict';

const ContextMenu = require('./contextMenu');

class BasicContextMenu extends ContextMenu {
    constructor(parentElem) {
        super(parentElem);

        this._items = {
            oops: {
                type: 'label',
                label: 'If you see this, report a bug'
            }
        };
        this._toggleElems = {};
    }

    _buildDom() {
        let menu = document.createElement('div');
        menu.classList.add('context-menu');
        this._toggleElems = {};

        for (let itemName in this._items) {
            if (this._items.hasOwnProperty(itemName)) {
                let item = this._items[itemName];
                let itemElem = document.createElement('div');
                if (item.type === 'divider') {
                    itemElem.classList.add('context-menu-divider');
                } else {
                    itemElem.classList.add('context-menu-item');
                    if (item.type) {
                        itemElem.classList.add(item.type);
                    }
                    itemElem.textContent = item.label || itemName;

                    if (item.type === 'label') {
                        itemElem.classList.add('label');
                    }
                    else if (item.type === 'toggle') {
                        this._toggleElems[itemName] = itemElem;
                    }


                    if (item.type !== 'label') {
                        itemElem.onclick = () => {
                            this[itemName].call(this);
                            this.hide();
                        };
                    }
                }
                menu.appendChild(itemElem);
            }
        }

        return menu;
    }

    show(mouseEvent) {
        super.show(mouseEvent);
        if (this._toggleElems) {
            for (let toggleName in this._toggleElems) {
                if (this._toggleElems.hasOwnProperty(toggleName)) {
                    let toggleEnabledFn = this[toggleName + '__state'];
                    if (toggleEnabledFn && toggleEnabledFn.call(this)) {
                        this._toggleElems[toggleName].classList.add('enabled');
                    }
                    else {
                        this._toggleElems[toggleName].classList.remove('enabled');
                    }
                }
            }
        }
    }
}

module.exports = BasicContextMenu;
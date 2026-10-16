// src/services/LayoutService.js

export class LayoutService {
    constructor() {
        this.layouts = window.KEYBOARD_LAYOUTS || {};
    }

    /**
     * Get layout by name
     * @param {string} name - Layout name
     * @returns {Array}
     */
    getLayout(name) {
        return this.layouts[name] || this.layouts.qwerty || [];
    }

    /**
     * Check if layout exists
     * @param {string} name - Layout name
     * @returns {boolean}
     */
    hasLayout(name) {
        return !!this.layouts[name];
    }

    /**
     * Get all available layout names
     * @returns {string[]}
     */
    getAvailableLayouts() {
        return Object.keys(this.layouts).filter(key => !key.endsWith('_upper'));
    }
}
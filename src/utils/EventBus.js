// src/utils/EventBus.js

export class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} - Unsubscribe function
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }

        this.events[eventName].push(callback);

        // Return unsubscribe function
        return () => {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        };
    }

    /**
     * Emit an event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     */
    emit(eventName, data) {
        if (!this.events[eventName]) return;

        this.events[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`EventBus: Error in ${eventName} handler:`, error);
            }
        });
    }

    /**
     * Subscribe to event once
     * @param {string} eventName - Event name
     * @param {Function} callback - Callback function
     */
    once(eventName, callback) {
        const unsubscribe = this.on(eventName, (data) => {
            callback(data);
            unsubscribe();
        });
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName - Event name
     */
    off(eventName) {
        delete this.events[eventName];
    }

    /**
     * Remove all listeners
     */
    clear() {
        this.events = {};
    }
}
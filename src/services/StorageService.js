// src/services/StorageService.js

export class StorageService {
    constructor() {
        this.pendingRequests = new Map();
    }

    /**
     * Get data from chrome.storage.sync
     * @param {string[]} keys - Keys to retrieve
     * @returns {Promise<Object>}
     */
    async get(keys) {
        return new Promise((resolve, reject) => {
            const requestId = this._generateRequestId();
            let resolved = false;

            console.log(`[${requestId}] Storage GET request:`, keys);

            window.postMessage({
                type: 'VK_STORAGE_GET',
                keys,
                requestId
            }, '*');

            const handler = (e) => {
                if (e.data.type === 'VK_STORAGE_GET_RESPONSE' &&
                    e.data.requestId === requestId &&
                    !resolved) {
                    resolved = true;
                    window.removeEventListener('message', handler);
                    console.log(`[${requestId}] Storage GET response:`, e.data.result);
                    resolve(e.data.result || {});
                }
            };

            window.addEventListener('message', handler);

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    window.removeEventListener('message', handler);
                    console.warn(`[${requestId}] Storage GET timeout`);
                    resolve({});
                }
            }, 500);
        });
    }

    /**
     * Set data in chrome.storage.sync
     * @param {Object} data - Data to store
     * @returns {Promise<boolean>}
     */
    async set(data) {
        return new Promise((resolve) => {
            window.postMessage({ type: 'VK_STORAGE_SET', data }, '*');

            const handler = (e) => {
                if (e.data.type === 'VK_STORAGE_SET_RESPONSE') {
                    window.removeEventListener('message', handler);
                    resolve(e.data.result);
                }
            };

            window.addEventListener('message', handler);

            setTimeout(() => {
                window.removeEventListener('message', handler);
                console.warn('Storage SET timeout');
                resolve(false);
            }, 500);
        });
    }

    /**
     * Get data from chrome.storage.local
     * @param {string[]} keys - Keys to retrieve
     * @returns {Promise<Object>}
     */
    async getLocal(keys) {
        return new Promise((resolve) => {
            window.postMessage({ type: 'VK_STORAGE_LOCAL_GET', keys }, '*');

            const handler = (e) => {
                if (e.data.type === 'VK_STORAGE_LOCAL_GET_RESPONSE') {
                    window.removeEventListener('message', handler);
                    resolve(e.data.result);
                }
            };

            window.addEventListener('message', handler);

            setTimeout(() => {
                window.removeEventListener('message', handler);
                console.warn('Local Storage GET timeout');
                resolve({});
            }, 500);
        });
    }

    /**
     * Set data in chrome.storage.local
     * @param {Object} data - Data to store
     * @returns {Promise<boolean>}
     */
    async setLocal(data) {
        return new Promise((resolve) => {
            window.postMessage({ type: 'VK_STORAGE_LOCAL_SET', data }, '*');

            const handler = (e) => {
                if (e.data.type === 'VK_STORAGE_LOCAL_SET_RESPONSE') {
                    window.removeEventListener('message', handler);
                    resolve(e.data.result);
                }
            };

            window.addEventListener('message', handler);

            setTimeout(() => {
                window.removeEventListener('message', handler);
                console.warn('Local Storage SET timeout');
                resolve(false);
            }, 500);
        });
    }

    _generateRequestId() {
        return Math.random().toString(36).substring(7);
    }
}
/** Thin promise wrapper over chrome.storage (sync for settings, local for history/secrets). */
export class StorageService {
    /** @param {string[] | null} keys */
    get(keys) {
        return chrome.storage.sync.get(keys);
    }

    /** @param {Object} data */
    async set(data) {
        await chrome.storage.sync.set(data);
        return true;
    }

    /** @param {string[] | null} keys */
    getLocal(keys) {
        return chrome.storage.local.get(keys);
    }

    /** @param {Object} data */
    async setLocal(data) {
        await chrome.storage.local.set(data);
        return true;
    }
}

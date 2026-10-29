import { KeyboardConfig } from '../core/KeyboardConfig.js';

export class ClipboardManager {
    constructor(state, storageService) {
        this.state = state;
        this.storageService = storageService;
    }

    async saveToHistory(text) {
        if (!text || text.length < KeyboardConfig.CLIPBOARD.MIN_TEXT_LENGTH) {
            return;
        }

        const data = await this.storageService.get(['saveHistory']);
        if (data.saveHistory === false) {
            return;
        }

        if (this.state.clipboardHistory.some(item => item.text === text)) {
            return;
        }

        this.state.clipboardHistory.unshift({
            text: text,
            timestamp: Date.now()
        });

        if (this.state.clipboardHistory.length > KeyboardConfig.CLIPBOARD.MAX_ITEMS) {
            this.state.clipboardHistory = this.state.clipboardHistory.slice(
                0,
                KeyboardConfig.CLIPBOARD.MAX_ITEMS
            );
        }

        await this.storageService.setLocal({
            clipboardHistory: this.state.clipboardHistory
        });
    }

    async loadHistory() {
        const data = await this.storageService.getLocal(['clipboardHistory']);
        if (data.clipboardHistory) {
            this.state.clipboardHistory = data.clipboardHistory;
        }
    }

    getHistory(limit = 10) {
        return this.state.clipboardHistory.slice(0, limit);
    }

    async clearHistory() {
        this.state.clipboardHistory = [];
        await this.storageService.setLocal({ clipboardHistory: [] });
    }

    getItem(index) {
        return this.state.clipboardHistory[index] || null;
    }
}
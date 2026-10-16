// src/core/KeyboardState.js

export class KeyboardState {
    constructor() {
        this.isVisible = false;
        this.isInitialized = false;
        this.settingsLoaded = false;
        this.isDragging = false;

        this.size = 'medium';
        this.theme = 'light';
        this.position = { x: 100, y: 100 };
        this.dragOffset = { x: 0, y: 0 };

        this.activeField = null;
        this.currentLayout = 'qwerty';
        this.showingSymbols = false;

        this.capsLock = false;
        this.shift = false;
        this.autoComplete = true;
        this.soundEnabled = false;
        this.secureInput = true;

        this.blockedSites = [];
        this.snippets = [];
        this.autofillData = {};
        this.commonWords = [];

        this.clipboardHistory = [];
        this.suggestions = [];

        this.openaiKey = '';
        this.aiFeatures = {
            proofreading: true,
            continuation: true,
            model: 'gpt-4o-mini'
        };
        this.aiLoading = false;
        this.lastAiRequest = 0;
    }

    reset() {
        this.shift = false;
        this.showingSymbols = false;
    }

    toggleShift() {
        this.shift = !this.shift;
    }

    setActiveField(field) {
        this.activeField = field;
    }

    updatePosition(x, y) {
        this.position = { x, y };
    }
}
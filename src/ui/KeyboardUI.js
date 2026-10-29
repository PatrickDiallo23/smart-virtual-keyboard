import { KeyboardConfig, THEME_ICONS } from '../core/KeyboardConfig.js';
import { DOMHelpers } from '../utils/DOMHelpers.js';

export class KeyboardUI {
    constructor(state, layoutService) {
        this.state = state;
        this.layoutService = layoutService;
        this.container = null;
    }

    createContainer() {
        const existing = document.getElementById('vk-container');
        if (existing) {
            existing.remove();
        }

        const container = document.createElement('div');
        container.id = 'vk-container';
        container.className = `vk-keyboard vk-${this.state.size} vk-theme-${this.state.theme}`;

        const initialPosition = this._calculateInitialPosition();
        this.state.updatePosition(initialPosition.x, initialPosition.y);

        container.style.cssText = `
            position: fixed;
            left: ${this.state.position.x}px;
            top: ${this.state.position.y}px;
            z-index: ${KeyboardConfig.UI.Z_INDEX};
            display: none;
        `;

        DOMHelpers.setInnerHTML(container, this._getContainerHTML());

        document.body.appendChild(container);
        this.container = container;

        return container;
    }

    renderKeys() {
        const keysContainer = this.container.querySelector('#vk-keys');
        if (!keysContainer) {
            console.error('KeyboardUI: Keys container not found');
            return;
        }

        DOMHelpers.setInnerHTML(keysContainer, '');

        const currentLayoutKeys = this._getCurrentLayoutKeys();

        currentLayoutKeys.forEach((row) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'vk-row';

            row.forEach((key) => {
                const keyBtn = this._createKeyButton(key);
                rowDiv.appendChild(keyBtn);
            });

            keysContainer.appendChild(rowDiv);
        });

    }

    updateDisplay(text, charCount) {
        const display = this.container.querySelector('#vk-input-display');
        const charCountEl = this.container.querySelector('#vk-char-count');

        if (!display || !charCountEl) return;

        if (text) {
            display.textContent = text;
            display.classList.remove('vk-placeholder');
            charCountEl.textContent = `${charCount} chars`;
        } else {
            DOMHelpers.setInnerHTML(display, '<span class="vk-placeholder">Type something...</span>');
            charCountEl.textContent = '0 chars';
        }
    }

    updateFieldType(fieldType) {
        const typeSpan = this.container.querySelector('#vk-field-type');
        if (typeSpan) {
            typeSpan.textContent = `${fieldType} field`;
        }
    }

    updateLayoutIndicator(layout) {
        const indicator = this.container.querySelector('#vk-layout');
        if (indicator) {
            indicator.textContent = layout.toUpperCase();
        }
    }

    toggleMinimize() {
        this.container.classList.toggle('vk-minimized');
    }

    show() {
        this.container.style.display = 'block';
        this.state.isVisible = true;
    }

    hide() {
        this.container.style.display = 'none';
        this.state.isVisible = false;
    }

    updateSize(newSize) {
        this.state.size = newSize;
        this.container.className = `vk-keyboard vk-${this.state.size} vk-theme-${this.state.theme}`;

        if (newSize === 'full') {
            this._positionFullMode();
        } else {
            this._positionNormalMode();
        }
    }

    updateTheme(newTheme) {
        this.state.theme = newTheme;
        this.container.className = `vk-keyboard vk-${this.state.size} vk-theme-${this.state.theme}`;

        const themeBtn = this.container.querySelector('#vk-theme span');
        if (themeBtn) {
            themeBtn.textContent = THEME_ICONS[newTheme];
        }
    }

    _calculateInitialPosition() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const sizeConfig = KeyboardConfig.SIZES[this.state.size.toUpperCase()];
        const keyboardWidth = sizeConfig.width;
        const keyboardHeight = sizeConfig.height;
        const padding = KeyboardConfig.UI.VIEWPORT_PADDING;

        let x = viewportWidth - keyboardWidth - padding;
        let y = viewportHeight - keyboardHeight - padding;

        x = Math.max(padding, x);
        y = Math.max(padding, y);

        return { x, y };
    }

    _getContainerHTML() {
        return `
            <div class="vk-header" id="vk-header">
                <div class="vk-title">
                    <span class="vk-icon">⌨️</span>
                    <span>Virtual Keyboard</span>
                    <span class="vk-layout-indicator" id="vk-layout">${this.state.currentLayout.toUpperCase()}</span>
                </div>
                <div class="vk-controls">
                    <button class="vk-btn-icon" id="vk-layout-switch" title="Switch Layout">🌍</button>
                    <button class="vk-btn-icon" id="vk-autocomplete" title="Toggle Autocomplete">
                        <span>${this.state.autoComplete ? '🔮' : '💤'}</span>
                    </button>
                    <button class="vk-btn-icon" id="vk-ai-assistant" title="AI Assistant">🤖</button>
                    <button class="vk-btn-icon" id="vk-clipboard" title="Clipboard History">📋</button>
                    <button class="vk-btn-icon" id="vk-autofill" title="Auto-Fill">📝</button>
                    <button class="vk-btn-icon" id="vk-sound" title="Toggle Sound">
                        <span>${this.state.soundEnabled ? '🔊' : '🔇'}</span>
                    </button>
                    <button class="vk-btn-icon" id="vk-theme" title="Toggle Theme">
                        <span>${THEME_ICONS[this.state.theme]}</span>
                    </button>
                    <button class="vk-btn-icon" id="vk-size" title="Change Size">📏</button>
                    <button class="vk-btn-icon" id="vk-minimize">−</button>
                    <button class="vk-btn-icon" id="vk-close">✕</button>
                </div>
            </div>
            
            <div class="vk-suggestions" id="vk-suggestions"></div>
            <div class="vk-clipboard-panel" id="vk-clipboard-panel" style="display: none;"></div>
            <div class="vk-autofill-panel" id="vk-autofill-panel" style="display: none;"></div>
            <div class="vk-ai-panel" id="vk-ai-panel" style="display: none;"></div>
            
            <div class="vk-input-display" id="vk-input-display">
                <span class="vk-placeholder">Click on any input field to start typing</span>
            </div>
            
            <div class="vk-keys" id="vk-keys"></div>
            
            <div class="vk-footer">
                <div class="vk-stats">
                    <span id="vk-char-count">0 chars</span>
                    <span class="vk-separator">•</span>
                    <span id="vk-field-type">No field selected</span>
                </div>
            </div>
        `;
    }

    _getCurrentLayoutKeys() {
        if (this.state.showingSymbols) {
            return this.layoutService.getLayout('symbols');
        } else if (this.state.shift || this.state.capsLock) {
            return this.layoutService.getLayout(this.state.currentLayout + '_upper');
        } else {
            return this.layoutService.getLayout(this.state.currentLayout);
        }
    }

    _createKeyButton(key) {
        const keyBtn = document.createElement('button');
        keyBtn.className = 'vk-key';

        if (key === 'Space') {
            keyBtn.className += ' vk-key-space';
            keyBtn.textContent = 'Space';
        } else if (key === 'Backspace') {
            keyBtn.className += ' vk-key-special';
            DOMHelpers.setInnerHTML(keyBtn, '⌫');
        } else if (key === 'Enter') {
            keyBtn.className += ' vk-key-special vk-key-enter';
            DOMHelpers.setInnerHTML(keyBtn, '↵');
        } else if (key === 'Shift') {
            keyBtn.className += ' vk-key-special';
            DOMHelpers.setInnerHTML(keyBtn, '⇧');
            if (this.state.shift || this.state.capsLock) {
                keyBtn.classList.add('vk-key-active');
            }
        } else if (key === 'Clear') {
            keyBtn.className += ' vk-key-special';
            keyBtn.textContent = 'Clear';
        } else if (key === '←' || key === '→') {
            keyBtn.className += ' vk-key-arrow';
            keyBtn.textContent = key;
        } else if (key === '123' || key === 'ABC') {
            keyBtn.className += ' vk-key-special';
            keyBtn.textContent = key;
        } else {
            keyBtn.textContent = key;
        }

        keyBtn.dataset.key = key;
        return keyBtn;
    }

    _positionFullMode() {
        this.container.style.left = '0px';
        this.container.style.top = 'auto';
        this.container.style.bottom = '0px';
        this.container.style.right = '0px';
        this.state.position.x = 0;
        this.state.position.y = window.innerHeight - this.container.offsetHeight;
    }

    _positionNormalMode() {
        this.container.style.bottom = 'auto';
        this.container.style.right = 'auto';

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const sizeConfig = KeyboardConfig.SIZES[this.state.size.toUpperCase()];
        const keyboardWidth = sizeConfig.width;
        const padding = KeyboardConfig.UI.VIEWPORT_PADDING;

        if (this.state.position.x + keyboardWidth > viewportWidth - padding) {
            this.state.position.x = viewportWidth - keyboardWidth - padding;
        }
        if (this.state.position.y + 350 > viewportHeight - padding) {
            this.state.position.y = viewportHeight - 370;
        }

        this.container.style.left = Math.max(padding, this.state.position.x) + 'px';
        this.container.style.top = Math.max(padding, this.state.position.y) + 'px';
    }
}
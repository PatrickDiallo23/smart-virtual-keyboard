import { KeyboardState } from './KeyboardState.js';
import { KeyboardConfig, DEFAULT_COMMON_WORDS } from './KeyboardConfig.js';
import { StorageService } from '../services/StorageService.js';
import { SoundService } from '../services/SoundService.js';
import { LayoutService } from '../services/LayoutService.js';
import { KeyboardUI } from '../ui/KeyboardUI.js';
import { KeyHandler } from '../input/KeyHandler.js';
import { FieldDetector } from '../input/FieldDetector.js';
import { AutoComplete } from '../features/AutoComplete.js';
import { ClipboardManager } from '../features/ClipboardManager.js';
import { SnippetExpander } from '../features/SnippetExpander.js';
import { AIAssistant } from '../features/AIAssistant.js';
import { AutoFillManager } from '../features/AutoFillManager.js';
import { ClipboardPanel } from '../ui/panels/ClipboardPanel.js';
import { AutoFillPanel } from '../ui/panels/AutoFillPanel.js';
import { AIPanel } from '../ui/panels/AIPanel.js';
import { EventBus } from '../utils/EventBus.js';
import { DOMHelpers } from '../utils/DOMHelpers.js';

export class VirtualKeyboard {
    constructor(config = {}) {

        this.config = {
            wordsUrl: config.wordsUrl || './common_words.txt',
            ...config
        };

        this.state = new KeyboardState();
        this.state.commonWords = DEFAULT_COMMON_WORDS;

        this.storageService = new StorageService();
        this.soundService = new SoundService();
        this.layoutService = new LayoutService();
        this.eventBus = new EventBus();

        this.snippetExpander = new SnippetExpander(this.state);
        this.autoComplete = new AutoComplete(this.state);
        this.clipboardManager = new ClipboardManager(this.state, this.storageService);
        this.aiAssistant = new AIAssistant(this.state);
        this.autoFillManager = new AutoFillManager(this.state, this.storageService);

        this.keyHandler = new KeyHandler(this.state, this.snippetExpander, this.soundService);
        this.fieldDetector = new FieldDetector(this.state);

        this.ui = null;
        this.clipboardPanel = null;
        this.autoFillPanel = null;
        this.aiPanel = null;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        if (this.state.isInitialized) {
            return;
        }

        this.ui = new KeyboardUI(this.state, this.layoutService);
        this.ui.createContainer();
        this.ui.renderKeys();

        this.clipboardPanel = new ClipboardPanel(this.ui.container, this.clipboardManager, this.state);
        this.autoFillPanel = new AutoFillPanel(this.ui.container, this.autoFillManager, this.state);
        this.aiPanel = new AIPanel(this.ui.container, this.aiAssistant, this.state);

        this._attachEventListeners();

        this.fieldDetector.setupListeners((field) => this._onFieldActivated(field));
        document.addEventListener('focusout', (e) => {
            if (this.state.activeField?.contains(e.target)) this._saveActiveFieldToHistory();
        });

        this.state.isInitialized = true;

        try {
            await this.loadSettings();
        } catch (err) {
            console.error('VirtualKeyboard: Failed to load settings:', err);
        }

    }

    async loadSettings() {

        try {
            const data = await this.storageService.get([
                'size', 'theme', 'autoComplete', 'soundEnabled',
                'currentLayout', 'secureInput', 'blockedSites',
                'snippets', 'aiModel', 'extensionEnabled'
            ]);
            const { openaiKey } = await this.storageService.getLocal(['openaiKey']);
            this.state.aiConfigured = Boolean(openaiKey?.trim());

            this.state.enabled = data.extensionEnabled !== false;
            if (!this.state.enabled) this.ui?.hide();
            if (data.size) this.state.size = data.size;
            if (data.theme) this.state.theme = data.theme;
            if (data.autoComplete !== undefined) this.state.autoComplete = data.autoComplete;
            if (data.soundEnabled !== undefined) this.state.soundEnabled = data.soundEnabled;
            if (data.currentLayout) this.state.currentLayout = data.currentLayout;
            if (data.secureInput !== undefined) this.state.secureInput = data.secureInput;
            if (data.aiModel) this.state.aiFeatures.model = data.aiModel;

            if (data.blockedSites !== undefined) {
                if (typeof data.blockedSites === 'string') {
                    this.state.blockedSites = data.blockedSites
                        .split('\n')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                } else if (Array.isArray(data.blockedSites)) {
                    this.state.blockedSites = data.blockedSites;
                }
            }

            if (Array.isArray(data.snippets)) {
                this.snippetExpander.loadSnippets(data.snippets);
            }

            if (this.ui) {
                this._updateUIFromState();
            }

            await this.clipboardManager.loadHistory();

            if (this.config.wordsUrl && this.state.commonWords === DEFAULT_COMMON_WORDS) {
                await this.autoComplete.loadCommonWords(this.config.wordsUrl);
            }

            this.state.settingsLoaded = true;
            return true;
        } catch (err) {
            console.error('VirtualKeyboard: Error loading settings:', err);
            this.state.settingsLoaded = false;
            throw err;
        }
    }

    async saveSettings() {
        const settings = {
            size: this.state.size,
            theme: this.state.theme,
            autoComplete: this.state.autoComplete,
            soundEnabled: this.state.soundEnabled,
            currentLayout: this.state.currentLayout
        };
        await this.storageService.set(settings);
    }

    show() {
        this.ui.show();
    }

    hide() {
        this.ui.hide();
    }

    toggle() {
        if (!this.state.enabled) return;
        if (this.state.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    _attachEventListeners() {
        const container = this.ui.container;
        this._setupDragHandling(container);

        container.querySelector('#vk-close').addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
        });

        container.querySelector('#vk-minimize').addEventListener('click', (e) => {
            e.preventDefault();
            this.ui.toggleMinimize();
        });

        container.querySelector('#vk-size').addEventListener('click', (e) => {
            e.preventDefault();
            this._cycleSizes();
        });

        container.querySelector('#vk-layout-switch').addEventListener('click', (e) => {
            e.preventDefault();
            this._cycleLayouts();
        });

        container.querySelector('#vk-theme').addEventListener('click', (e) => {
            e.preventDefault();
            this._cycleThemes();
        });

        container.querySelector('#vk-autocomplete').addEventListener('click', (e) => {
            e.preventDefault();
            this._toggleAutoComplete();
        });

        container.querySelector('#vk-sound').addEventListener('click', (e) => {
            e.preventDefault();
            this._toggleSound();
        });

        container.querySelector('#vk-ai-assistant').addEventListener('click', (e) => {
            e.preventDefault();
            this.aiPanel.toggle();
        });

        container.querySelector('#vk-clipboard').addEventListener('click', (e) => {
            e.preventDefault();
            this.clipboardPanel.toggle();
        });

        container.querySelector('#vk-autofill').addEventListener('click', (e) => {
            e.preventDefault();
            this.autoFillPanel.toggle();
        });

        container.querySelector('#vk-keys').addEventListener('click', (e) => {
            const keyBtn = e.target.closest('.vk-key');
            if (!keyBtn) return;

            e.preventDefault();
            e.stopPropagation();
            const key = keyBtn.dataset.key;
            this._handleKeyClick(key);
        });
    }

    _setupDragHandling(container) {
        let dragStartPos = { x: 0, y: 0 };

        container.addEventListener('mousedown', (e) => {
            // Keep focus in the page's field while using the keyboard
            e.preventDefault();
            // Don't drag when clicking buttons
            if (e.target.closest('.vk-key') ||
                e.target.closest('.vk-controls') ||
                e.target.closest('.vk-suggestion') ||
                e.target.classList.contains('vk-input-display')) {
                return;
            }

            dragStartPos = { x: e.clientX, y: e.clientY };
            this.state.dragOffset.x = e.clientX - this.state.position.x;
            this.state.dragOffset.y = e.clientY - this.state.position.y;

            const moveHandler = (e) => {
                const deltaX = Math.abs(e.clientX - dragStartPos.x);
                const deltaY = Math.abs(e.clientY - dragStartPos.y);

                if (deltaX > KeyboardConfig.UI.DRAG_THRESHOLD ||
                    deltaY > KeyboardConfig.UI.DRAG_THRESHOLD) {
                    if (!this.state.isDragging) {
                        this.state.isDragging = true;
                        container.style.cursor = 'grabbing';
                        // container.style.transition = 'none';
                    }
                }

                if (this.state.isDragging) {
                    requestAnimationFrame(() => {
                        const newX = e.clientX - this.state.dragOffset.x;
                        const newY = e.clientY - this.state.dragOffset.y;
                        this.state.updatePosition(newX, newY);
                        container.style.left = newX + 'px';
                        container.style.top = newY + 'px';
                    });
                }
            };

            const upHandler = () => {
                if (this.state.isDragging) {
                    this.state.isDragging = false;
                    container.style.cursor = 'grab';
                    container.style.transform = '';
                }
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };

            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
            e.preventDefault();
        });
    }

    _handleKeyClick(key) {
        const result = this.keyHandler.handleKey(key);

        if (result) {
            if (result.shouldRenderKeys) {
                this.ui.renderKeys();
            }

            if (result.value !== undefined) {
                this._updateDisplay();
                this._updateSuggestions();
            }

            if (result.shouldUpdateDisplay) {
                this._updateDisplay();
            }
        }
    }

    _onFieldActivated(field) {
        if (field !== this.state.activeField) {
            this._saveActiveFieldToHistory();
        }
        this.state.setActiveField(field);
        this.show();
        this._updateDisplay();
        this.ui.updateFieldType(this.fieldDetector.getFieldType(field));
    }

    _saveActiveFieldToHistory(field = this.state.activeField) {
        if (field?.value) this.clipboardManager.saveToHistory(field.value);
    }

    _updateDisplay() {
        if (this.state.activeField) {
            const text = this.state.activeField.value || '';
            this.ui.updateDisplay(text, text.length);
        }
    }

    _updateSuggestions() {
        if (!this.state.activeField) return;

        const suggestions = this.autoComplete.getSuggestions(this.state.activeField.value);
        this._renderSuggestions(suggestions);
    }

    _renderSuggestions(suggestions) {
        const suggestionsDiv = this.ui.container.querySelector('#vk-suggestions');
        if (!suggestionsDiv) return;

        if (suggestions.length === 0) {
            DOMHelpers.setInnerHTML(suggestionsDiv, '');
            return;
        }

        const html = suggestions
            .map(word => `<button class="vk-suggestion">${DOMHelpers.escapeHtml(word)}</button>`)
            .join('');

        DOMHelpers.setInnerHTML(suggestionsDiv, html);

        suggestionsDiv.querySelectorAll('.vk-suggestion').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (this.state.activeField) {
                    this.state.activeField.value = this.autoComplete.applySuggestion(
                        this.state.activeField.value,
                        btn.textContent
                    );
                    this.state.activeField.focus();
                    this._updateDisplay();
                    DOMHelpers.setInnerHTML(suggestionsDiv, '');
                    this.state.activeField.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        });
    }

    _cycleSizes() {
        const sizes = ['small', 'medium', 'large', 'full'];
        const currentIndex = sizes.indexOf(this.state.size);
        const newSize = sizes[(currentIndex + 1) % sizes.length];
        this.ui.updateSize(newSize);
        this.saveSettings();
    }

    _cycleLayouts() {
        const layouts = KeyboardConfig.LAYOUTS;
        const currentIndex = layouts.indexOf(this.state.currentLayout);
        this.state.currentLayout = layouts[(currentIndex + 1) % layouts.length];
        this.ui.updateLayoutIndicator(this.state.currentLayout);
        this.ui.renderKeys();
        this.saveSettings();
    }

    _cycleThemes() {
        const themes = KeyboardConfig.THEMES;
        const currentIndex = themes.indexOf(this.state.theme);
        const newTheme = themes[(currentIndex + 1) % themes.length];
        this.ui.updateTheme(newTheme);
        this.saveSettings();
    }

    _toggleAutoComplete() {
        this.state.autoComplete = !this.state.autoComplete;
        const btn = this.ui.container.querySelector('#vk-autocomplete span');
        if (btn) {
            btn.textContent = this.state.autoComplete ? '🔮' : '💤';
        }
        if (!this.state.autoComplete) {
            DOMHelpers.setInnerHTML(this.ui.container.querySelector('#vk-suggestions'), '');
        }
        this.saveSettings();
    }

    _toggleSound() {
        this.state.soundEnabled = !this.state.soundEnabled;
        const btn = this.ui.container.querySelector('#vk-sound span');
        if (btn) {
            btn.textContent = this.state.soundEnabled ? '🔊' : '🔇';
        }
        this.saveSettings();
        if (this.state.soundEnabled) {
            this.soundService.play();
        }
    }

    _updateUIFromState() {
        this.ui.container.className = `vk-keyboard vk-${this.state.size} vk-theme-${this.state.theme}`;
        this.ui.updateLayoutIndicator(this.state.currentLayout);

        const autocompleteBtn = this.ui.container.querySelector('#vk-autocomplete span');
        if (autocompleteBtn) {
            autocompleteBtn.textContent = this.state.autoComplete ? '🔮' : '💤';
        }

        const soundBtn = this.ui.container.querySelector('#vk-sound span');
        if (soundBtn) {
            soundBtn.textContent = this.state.soundEnabled ? '🔊' : '🔇';
        }
    }
}

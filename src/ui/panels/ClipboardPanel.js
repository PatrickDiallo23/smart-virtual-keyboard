// src/ui/panels/ClipboardPanel.js

import { DOMHelpers } from '../../utils/DOMHelpers.js';

export class ClipboardPanel {
    constructor(container, clipboardManager, state) {
        this.container = container;
        this.clipboardManager = clipboardManager;
        this.state = state;
        this.panel = container.querySelector('#vk-clipboard-panel');
        this.button = container.querySelector('#vk-clipboard');
    }

    /**
     * Toggle panel visibility
     */
    async toggle() {
        if (this.panel.style.display === 'none') {
            await this.show();
        } else {
            this.hide();
        }
    }

    /**
     * Show panel
     */
    async show() {
        // Hide other panels
        this._hideOtherPanels();

        await this.clipboardManager.loadHistory();
        this.render();
        this.panel.style.display = 'block';
        this.button.classList.add('active');
    }

    /**
     * Hide panel
     */
    hide() {
        this.panel.style.display = 'none';
        this.button.classList.remove('active');
    }

    /**
     * Render panel content
     */
    render() {
        const history = this.clipboardManager.getHistory(10);

        if (history.length === 0) {
            DOMHelpers.setInnerHTML(this.panel, '<div class="vk-panel-empty">No clipboard history yet</div>');
            return;
        }

        const html =
            '<div class="vk-panel-title">📋 Clipboard History (Click to paste)</div>' +
            history.map((item, index) => {
                const preview = item.text.length > 60 ?
                    item.text.substring(0, 60) + '...' :
                    item.text;
                return `<div class="vk-panel-item" data-index="${index}">${DOMHelpers.escapeHtml(preview)}</div>`;
            }).join('');

        DOMHelpers.setInnerHTML(this.panel, html);

        // Attach click handlers
        this.panel.querySelectorAll('.vk-panel-item').forEach((item, index) => {
            item.addEventListener('click', () => this._handleItemClick(index));
        });
    }

    /**
     * Handle item click
     * @param {number} index - Item index
     */
    _handleItemClick(index) {
        if (!this.state.activeField) return;

        const item = this.clipboardManager.getItem(index);
        if (!item) return;

        const field = this.state.activeField;
        const start = field.selectionStart || 0;
        const end = field.selectionEnd || 0;
        const value = field.value || '';

        field.value = value.slice(0, start) + item.text + value.slice(end);
        field.selectionStart = field.selectionEnd = start + item.text.length;
        field.focus();
        field.dispatchEvent(new Event('input', { bubbles: true }));

        this.hide();
    }

    _hideOtherPanels() {
        const autofillPanel = this.container.querySelector('#vk-autofill-panel');
        const aiPanel = this.container.querySelector('#vk-ai-panel');
        const autofillButton = this.container.querySelector('#vk-autofill');
        const aiButton = this.container.querySelector('#vk-ai-assistant');

        if (autofillPanel) {
            autofillPanel.style.display = 'none';
            autofillButton.classList.remove('active');
        }
        if (aiPanel) {
            aiPanel.style.display = 'none';
            aiButton.classList.remove('active');
        }
    }
}
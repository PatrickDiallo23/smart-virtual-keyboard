// src/ui/panels/AutoFillPanel.js

import { DOMHelpers } from '../../utils/DOMHelpers.js';

export class AutoFillPanel {
    constructor(container, autoFillManager, state) {
        this.container = container;
        this.autoFillManager = autoFillManager;
        this.state = state;
        this.panel = container.querySelector('#vk-autofill-panel');
        this.button = container.querySelector('#vk-autofill');
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

        await this.autoFillManager.loadAutofillData();
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
        const items = this.autoFillManager.getAutofillItems();

        if (items.length === 0) {
            DOMHelpers.setInnerHTML(
                this.panel,
                '<div class="vk-panel-empty">No auto-fill data configured<br><small>Set up in extension settings</small></div>'
            );
            return;
        }

        const html =
            '<div class="vk-panel-title">📝 Auto-Fill (Click to insert)</div>' +
            items.map(item =>
                `<div class="vk-panel-item" data-value="${DOMHelpers.escapeHtml(item.value)}">
                ${item.icon} ${item.label}: ${DOMHelpers.escapeHtml(item.value)}
            </div>`
            ).join('');

        DOMHelpers.setInnerHTML(this.panel, html);

        // Attach click handlers
        this.panel.querySelectorAll('.vk-panel-item').forEach(item => {
            item.addEventListener('click', () => this._handleItemClick(item));
        });
    }

    /**
     * Handle item click
     * @param {HTMLElement} item - Clicked item
     */
    _handleItemClick(item) {
        if (!this.state.activeField) return;

        const value = item.getAttribute('data-value');
        this.autoFillManager.insertValue(this.state.activeField, value);

        this.hide();
    }

    _hideOtherPanels() {
        const clipboardPanel = this.container.querySelector('#vk-clipboard-panel');
        const aiPanel = this.container.querySelector('#vk-ai-panel');
        const aiButton = this.container.querySelector('#vk-ai-assistant');
        const clipboardButton = this.container.querySelector('#vk-clipboard');

        if (clipboardPanel) {
            clipboardPanel.style.display = 'none';
            clipboardButton.classList.remove('active');
        }
        if (aiPanel) {
            aiPanel.style.display = 'none';
            aiButton.classList.remove('active');
        }
    }
}
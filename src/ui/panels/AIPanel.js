import { DOMHelpers } from '../../utils/DOMHelpers.js';

export class AIPanel {
    constructor(container, aiAssistant, state) {
        this.container = container;
        this.aiAssistant = aiAssistant;
        this.state = state;
        this.panel = container.querySelector('#vk-ai-panel');
        this.button = container.querySelector('#vk-ai-assistant');

    }

    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.panel.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * Show panel
     */
    show() {
        if (!this.state.activeField || !this.state.activeField.value) {
            alert('Please type some text first!');
            return;
        }

        // Hide other panels
        this._hideOtherPanels();

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
        const currentText = this.state.activeField ? this.state.activeField.value : '';
        const hasText = currentText.trim().length > 0;

        if (!this.state.openaiKey) {
            DOMHelpers.setInnerHTML(this.panel, `
            <div class="vk-panel-title">🤖 AI Assistant</div>
            <div class="vk-panel-empty">
                OpenAI API key not configured.<br>
                <small>Add your key in extension settings</small>
            </div>
        `);
            return;
        }

        const html = `
        <div class="vk-panel-title">🤖 AI Assistant</div>
        <div class="vk-ai-actions">
            <button class="vk-ai-btn" id="ai-proofread" ${!hasText ? 'disabled' : ''}>
                ✍️ Proofread
            </button>
            <button class="vk-ai-btn" id="ai-continue" ${!hasText ? 'disabled' : ''}>
                ➡️ Continue
            </button>
            <button class="vk-ai-btn" id="ai-suggest" ${!hasText ? 'disabled' : ''}>
                💡 Suggest
            </button>
        </div>
        <div class="vk-ai-result" id="ai-result" style="display: none;"></div>
        <div class="vk-ai-loading" id="ai-loading" style="display: none;">
            <div class="vk-spinner"></div>
            <span>AI is thinking...</span>
        </div>
    `;

        DOMHelpers.setInnerHTML(this.panel, html);

        // Attach event listeners
        this._attachEventListeners();
    }

    /**
     * Attach event listeners to AI buttons
     */
    _attachEventListeners() {
        const proofreadBtn = this.panel.querySelector('#ai-proofread');
        const continueBtn = this.panel.querySelector('#ai-continue');
        const suggestBtn = this.panel.querySelector('#ai-suggest');

        if (proofreadBtn) {
            proofreadBtn.addEventListener('click', () => this._handleProofread());
        }

        if (continueBtn) {
            continueBtn.addEventListener('click', () => this._handleContinue());
        }

        if (suggestBtn) {
            suggestBtn.addEventListener('click', () => this._handleSuggest());
        }
    }

    /**
     * Handle proofread action
     */
    async _handleProofread() {
        if (this.state.aiLoading) return;

        const resultDiv = this.panel.querySelector('#ai-result');
        const loadingDiv = this.panel.querySelector('#ai-loading');
        const currentText = this.state.activeField.value;

        try {
            resultDiv.style.display = 'none';
            loadingDiv.style.display = 'flex';

            const corrected = await this.aiAssistant.proofreadText(currentText);

            loadingDiv.style.display = 'none';
            const html = `
            <div class="vk-ai-result-label">Proofread Result:</div>
            <div class="vk-ai-result-text">${DOMHelpers.escapeHtml(corrected)}</div>
            <button class="vk-ai-apply" data-text="${DOMHelpers.escapeHtml(corrected)}">
                Apply Changes
            </button>
        `;

            DOMHelpers.setInnerHTML(resultDiv, html);
            resultDiv.style.display = 'block';

            this._attachApplyHandler(resultDiv);
        } catch (error) {
            loadingDiv.style.display = 'none';
            DOMHelpers.setInnerHTML(resultDiv, `<div class="vk-ai-error">❌ ${DOMHelpers.escapeHtml(error.message)}</div>`);
            resultDiv.style.display = 'block';
        }
    }

    /**
     * Handle continue action
     */
    async _handleContinue() {
        if (this.state.aiLoading) return;

        const resultDiv = this.panel.querySelector('#ai-result');
        const loadingDiv = this.panel.querySelector('#ai-loading');
        const currentText = this.state.activeField.value;

        try {
            resultDiv.style.display = 'none';
            loadingDiv.style.display = 'flex';

            const continuation = await this.aiAssistant.continueText(currentText);

            loadingDiv.style.display = 'none';
            html = `
                <div class="vk-ai-result-label">Continuation:</div>
                <div class="vk-ai-result-text">${DOMHelpers.escapeHtml(continuation)}</div>
                <button class="vk-ai-apply" data-text="${DOMHelpers.escapeHtml(continuation)}" data-append="true">
                    Append to Text
                </button>
            `;
            DOMHelpers.setInnerHTML(resultDiv, html);
            resultDiv.style.display = 'block';

            this._attachApplyHandler(resultDiv);
        } catch (error) {
            loadingDiv.style.display = 'none';
            DOMHelpers.setInnerHTML(resultDiv, `<div class="vk-ai-error">❌ ${DOMHelpers.escapeHtml(error.message)}</div>`);
            resultDiv.style.display = 'block';
        }
    }

    /**
     * Handle suggest action
     */
    async _handleSuggest() {
            if (this.state.aiLoading) return;

            const resultDiv = this.panel.querySelector('#ai-result');
            const loadingDiv = this.panel.querySelector('#ai-loading');
            const currentText = this.state.activeField.value;

            try {
                resultDiv.style.display = 'none';
                loadingDiv.style.display = 'flex';

                const suggestions = await this.aiAssistant.getSmartSuggestions(currentText);

                loadingDiv.style.display = 'none';

                if (suggestions.length === 0) {
                    DOMHelpers.setInnerHTML(resultDiv, `<div class="vk-ai-error">No suggestions available</div>`);
                } else {
                    html = `
                    <div class="vk-ai-result-label">Suggestions:</div>
                    ${suggestions.map(s => 
                        `<button class="vk-ai-suggestion" data-text="${DOMHelpers.escapeHtml(s)}" data-append="true">
                            ${DOMHelpers.escapeHtml(s)}
                        </button>`
                    ).join('')}
                `;
                DOMHelpers.setInnerHTML(resultDiv, html);
                
                resultDiv.querySelectorAll('.vk-ai-suggestion').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (this.state.activeField) {
                            const text = btn.getAttribute('data-text');
                            this.state.activeField.value += ' ' + text;
                            this.state.activeField.dispatchEvent(new Event('input', { bubbles: true }));
                            this._updateDisplay();
                            this.state.activeField.focus();
                            resultDiv.style.display = 'none';
                        }
                    });
                });
            }
            
            resultDiv.style.display = 'block';
        } catch (error) {
            loadingDiv.style.display = 'none';
            DOMHelpers.setInnerHTML(resultDiv, `<div class="vk-ai-error">❌ ${DOMHelpers.escapeHtml(error.message)}</div>`);
            resultDiv.style.display = 'block';
        }
    }
    
    /**
     * Attach handler to apply button
     * @param {HTMLElement} resultDiv - Result container
     */
    _attachApplyHandler(resultDiv) {
        const applyBtn = resultDiv.querySelector('.vk-ai-apply');
        if (!applyBtn) return;
        
        applyBtn.addEventListener('click', () => {
            if (!this.state.activeField) return;
            
            const text = applyBtn.getAttribute('data-text');
            const append = applyBtn.getAttribute('data-append') === 'true';
            
            if (append) {
                this.state.activeField.value += ' ' + text;
            } else {
                this.state.activeField.value = text;
            }
            
            this.state.activeField.dispatchEvent(new Event('input', { bubbles: true }));
            this._updateDisplay();
            this.state.activeField.focus();
            resultDiv.style.display = 'none';
        });
    }
    
    _hideOtherPanels() {
        const clipboardPanel = this.container.querySelector('#vk-clipboard-panel');
        const autofillPanel = this.container.querySelector('#vk-autofill-panel');
        const autofillButton = this.container.querySelector('#vk-autofill');
        const clipboardButton = this.container.querySelector('#vk-clipboard');
        
        if (clipboardPanel) {
            clipboardPanel.style.display = 'none';
            clipboardButton.classList.remove('active');
        }
        if (autofillPanel) {
            autofillPanel.style.display = 'none';
            autofillButton.classList.remove('active');
        }
    }

     _updateDisplay() {
        if (this.state.activeField) {
            const text = this.state.activeField.value || '';
            this._updateDisplayAfterApply(text, text.length);
        }
    }

    _updateDisplayAfterApply(text, charCount) {
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

}
// src/features/AutoFillManager.js

import { DOMHelpers } from '../utils/DOMHelpers.js';

export class AutoFillManager {
    constructor(state, storageService) {
        this.state = state;
        this.storageService = storageService;
    }

    /**
     * Load autofill data from storage
     */
    async loadAutofillData() {
        const data = await this.storageService.get([
            'autofillName',
            'autofillEmail',
            'autofillPhone',
            'autofillCompany',
            'autofillAddress'
        ]);

        this.state.autofillData = data;
        return data;
    }

    /**
     * Get autofill items
     * @returns {Array}
     */
    getAutofillItems() {
        const data = this.state.autofillData;
        return [
            { label: 'Name', value: data.autofillName, icon: '👤' },
            { label: 'Email', value: data.autofillEmail, icon: '📧' },
            { label: 'Phone', value: data.autofillPhone, icon: '📱' },
            { label: 'Company', value: data.autofillCompany, icon: '🏢' },
            { label: 'Address', value: data.autofillAddress, icon: '🏠' }
        ].filter(item => item.value);
    }

    /**
     * Insert autofill value into field
     * @param {HTMLElement} field - Target field
     * @param {string} value - Value to insert
     */
    insertValue(field, value) {
        if (!field) return;

        const start = field.selectionStart || 0;
        const end = field.selectionEnd || 0;
        const currentValue = field.value || '';

        field.value = currentValue.slice(0, start) + value + currentValue.slice(end);
        field.selectionStart = field.selectionEnd = start + value.length;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.focus();
    }
}
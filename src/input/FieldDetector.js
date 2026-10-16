export class FieldDetector {
    constructor(state) {
        this.state = state;
    }

    /**
     * Check if a field should be activated
     * @param {HTMLElement} element - Element to check
     * @returns {boolean}
     */
    shouldActivateField(element) {
        if (!element || (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA')) {
            return false;
        }

        const inputType = element.type ? element.type.toLowerCase() : '';

        // Check secure input mode
        if (this.state.secureInput && inputType === 'password') {
            console.log('FieldDetector: Blocked on password field (secure mode)');
            return false;
        }

        // Check blocked sites
        if (this._isBlockedSite()) {
            console.log('FieldDetector: Blocked on this domain:', window.location.hostname);
            return false;
        }

        // Exclude certain input types
        const excludedTypes = ['file', 'checkbox', 'radio', 'submit', 'button', 'hidden'];
        if (excludedTypes.includes(inputType)) {
            return false;
        }

        return true;
    }

    /**
     * Get field type description
     * @param {HTMLElement} field - Input field
     * @returns {string}
     */
    getFieldType(field) {
        return field.type || field.tagName.toLowerCase();
    }

    /**
     * Check if field can have selection (for cursor positioning)
     * @param {HTMLElement} field - Input field
     * @returns {boolean}
     */
    canSetSelection(field) {
        if (field.tagName === 'TEXTAREA') {
            return true;
        }

        if (field.tagName === 'INPUT') {
            const selectableTypes = ['text', 'search', 'password', 'tel', 'url'];
            return selectableTypes.includes(field.type);
        }

        return false;
    }

    /**
     * Setup field detection listeners
     * @param {Function} onFieldActivated - Callback when field is activated
     */
    setupListeners(onFieldActivated) {
        // Focus event
        document.addEventListener('focusin', (e) => {
            if (this.shouldActivateField(e.target)) {
                console.log('FieldDetector: Field focused:', e.target.tagName, e.target.type);
                onFieldActivated(e.target);
            }
        });

        // Click event (for already focused fields)
        document.addEventListener('click', (e) => {
            if (this.shouldActivateField(e.target) && document.activeElement === e.target) {
                console.log('FieldDetector: Field clicked');
                onFieldActivated(e.target);
            }
        }, true);
    }

    // Private methods

    _isBlockedSite() {
        const hostname = window.location.hostname;
        return this.state.blockedSites.some(site => {
            const cleanSite = site.toLowerCase().trim();
            return hostname.includes(cleanSite) || hostname === cleanSite;
        });
    }
}
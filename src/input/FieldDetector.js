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
        if (!this.state.enabled) {
            return false;
        }

        if (!element) {
            return false;
        }

        if (this._isEditableHost(element)) {
            return !this._isBlockedSite();
        }

        if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
            return false;
        }

        const inputType = element.type ? element.type.toLowerCase() : '';

        // Check secure input mode
        if (this.state.secureInput && inputType === 'password') {
            return false;
        }

        // Check blocked sites
        if (this._isBlockedSite()) {
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
            const field = this._resolve(e.target);
            if (this.shouldActivateField(field)) {
                onFieldActivated(this._shimEditable(field));
            }
        });

        // Click event (for already focused fields)
        document.addEventListener('click', (e) => {
            const field = this._resolve(e.target);
            if (this.shouldActivateField(field) && document.activeElement === field) {
                onFieldActivated(this._shimEditable(field));
            }
        }, true);
    }

    // Private methods

    _isEditableHost(el) {
        return el.isContentEditable && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA'
            && el.parentElement && !el.parentElement.isContentEditable;
    }

    // Focus may land on a child of a contenteditable (e.g. ProseMirror's <p>); use the editing host.
    _resolve(el) {
        if (!el || !el.isContentEditable) return el;
        while (el.parentElement && el.parentElement.isContentEditable) el = el.parentElement;
        return el;
    }

    /**
     * Give a contenteditable the value/selectionStart/selectionEnd API the rest of the
     * code uses for inputs. Text is textContent, so line breaks between blocks are not visible to callers.
     * ponytail: plain-text view; writes touch only the changed span, never the whole document.
     */
    _shimEditable(el) {
        if (!this._isEditableHost(el) || el.__vkShim) return el;
        el.__vkShim = true;

        const offset = (node, off) => {
            const r = document.createRange();
            r.selectNodeContents(el);
            r.setEnd(node, off);
            return r.toString().length;
        };
        const point = (pos) => {
            const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let n, left = pos, last = null;
            while ((n = w.nextNode())) {
                last = n;
                if (left <= n.length) return [n, left];
                left -= n.length;
            }
            return last ? [last, last.length] : [el, el.childNodes.length];
        };
        const sel = (end) => {
            const s = window.getSelection();
            if (!s.rangeCount || !el.contains(s.anchorNode)) return el.textContent.length;
            const r = s.getRangeAt(0);
            return end ? offset(r.endContainer, r.endOffset) : offset(r.startContainer, r.startOffset);
        };
        const setSel = (a, b) => {
            const r = document.createRange();
            r.setStart(...point(a));
            r.setEnd(...point(b));
            const s = window.getSelection();
            s.removeAllRanges();
            s.addRange(r);
        };

        Object.defineProperties(el, {
            value: {
                get: () => el.textContent,
                // Replace only the span that differs, so formatting, undo history and caret outside it survive.
                set: (text) => {
                    const old = el.textContent;
                    if (text === old) return;
                    const max = Math.min(old.length, text.length);
                    let head = 0;
                    while (head < max && old[head] === text[head]) head++;
                    let tail = 0;
                    while (tail < max - head && old[old.length - 1 - tail] === text[text.length - 1 - tail]) tail++;
                    const inserted = text.slice(head, text.length - tail);
                    el.focus();
                    setSel(head, old.length - tail);
                    document.execCommand(inserted ? 'insertText' : 'delete', false, inserted);
                }
            },
            selectionStart: { get: () => sel(false), set: (p) => setSel(p, p) },
            selectionEnd: { get: () => sel(true), set: (p) => setSel(p, p) }
        });
        return el;
    }

    _isBlockedSite() {
        const hostname = window.location.hostname;
        return this.state.blockedSites.some(site => {
            const cleanSite = site.toLowerCase().trim();
            return hostname.includes(cleanSite) || hostname === cleanSite;
        });
    }
}
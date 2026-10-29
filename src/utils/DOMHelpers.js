export class DOMHelpers {
    static trustedTypesPolicy = null;

    static getTrustedTypesPolicy() {
        if (this.trustedTypesPolicy) {
            return this.trustedTypesPolicy;
        }

        // Check if Trusted Types are supported
        if (typeof window.trustedTypes !== 'undefined') {
            try {
                this.trustedTypesPolicy = window.trustedTypes.createPolicy('virtual-keyboard-policy', {
                    createHTML: (input) => input,
                    createScript: (input) => input,
                    createScriptURL: (input) => input
                });
            } catch (e) {
                console.warn('DOMHelpers: Failed to create Trusted Types policy:', e);
            }
        }

        return this.trustedTypesPolicy;
    }

    static setInnerHTML(element, html) {
        const policy = this.getTrustedTypesPolicy();

        if (policy) {
            element.innerHTML = policy.createHTML(html);
        } else {
            element.innerHTML = html;
        }
    }

    static escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);

        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else {
                element.setAttribute(key, value);
            }
        });

        if (typeof content === 'string') {
            this.setInnerHTML(element, content);
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        }

        return element;
    }

    static removeElement(selector) {
        const element = typeof selector === 'string' ?
            document.querySelector(selector) :
            selector;

        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    static addEventListeners(element, events) {
        Object.entries(events).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }
}
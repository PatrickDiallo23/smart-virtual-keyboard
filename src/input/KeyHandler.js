

export class KeyHandler {
    constructor(state, snippetExpander, soundService) {
        this.state = state;
        this.snippetExpander = snippetExpander;
        this.soundService = soundService;
    }

    handleKey(key) {
        if (!this.state.activeField) {
            console.warn('KeyHandler: No active field');
            return null;
        }

        if (this.state.soundEnabled) {
            this.soundService.play();
        }

        const field = this.state.activeField;
        const start = field.selectionStart || 0;
        const end = field.selectionEnd || 0;
        const value = field.value || '';

        let result = null;

        switch (key) {
            case '123':
                this.state.showingSymbols = true;
                return { shouldRenderKeys: true };

            case 'ABC':
                this.state.showingSymbols = false;
                return { shouldRenderKeys: true };

            case 'Backspace':
                result = this._handleBackspace(value, start, end);
                break;

            case 'Enter':
                result = this._handleEnter(value, start, end, field);
                break;

            case 'Space':
                result = this._handleSpace(value, start, end);
                break;

            case 'Shift':
                this.state.toggleShift();
                return { shouldRenderKeys: true };

            case 'Clear':
                result = { value: '', cursorPos: 0 };
                break;

            case '←':
                return this._handleArrowLeft(start);

            case '→':
                return this._handleArrowRight(start, value.length);

            default:
                result = this._handleCharacter(key, value, start, end);
        }

        if (result) {
            field.value = result.value;

            if (result.cursorPos !== undefined) {
                field.selectionStart = field.selectionEnd = result.cursorPos;
            }

            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.focus();

            return {
                value: result.value,
                cursorPos: result.cursorPos,
                shouldRenderKeys: this.state.shift && result.shouldResetShift
            };
        }

        return null;
    }

    _handleBackspace(value, start, end) {
        if (start > 0) {
            return {
                value: value.slice(0, start - 1) + value.slice(end),
                cursorPos: start - 1
            };
        }
        return null;
    }

    _handleEnter(value, start, end, field) {
        if (field.tagName === 'TEXTAREA') {
            return {
                value: value.slice(0, start) + '\n' + value.slice(end),
                cursorPos: start + 1
            };
        } else if (field.isContentEditable) {
            // Let the site handle Enter first (chat boxes send on it); synthetic events never run the
            // browser's default edit action, so insert the paragraph ourselves if nobody preventDefault()ed.
            const handled = !field.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true
            }));
            if (!handled) {
                document.execCommand('insertParagraph');
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return null;
        } else {
            if (field.form) {
                field.form.requestSubmit();
            }
            return null;
        }
    }

    _handleSpace(value, start, end) {
        const beforeCursor = value.slice(0, start);
        const words = beforeCursor.split(/\s+/);
        const lastWord = words[words.length - 1];

        const expanded = this.snippetExpander.expand(lastWord);

        if (expanded) {
            const beforeLastWord = value.slice(0, start - lastWord.length);
            const afterCursor = value.slice(end);
            return {
                value: beforeLastWord + expanded + ' ' + afterCursor,
                cursorPos: start - lastWord.length + expanded.length + 1
            };
        }

        return {
            value: value.slice(0, start) + ' ' + value.slice(end),
            cursorPos: start + 1
        };
    }

    _handleCharacter(key, value, start, end) {
        const char = (this.state.shift || this.state.capsLock) ? key.toUpperCase() : key;

        return {
            value: value.slice(0, start) + char + value.slice(end),
            cursorPos: start + 1,
            shouldResetShift: true
        };
    }

    _handleArrowLeft(start) {
        if (start > 0) {
            this.state.activeField.selectionStart = this.state.activeField.selectionEnd = start - 1;
        }
        this.state.activeField.focus();
        return { shouldUpdateDisplay: true };
    }

    _handleArrowRight(start, length) {
        if (start < length) {
            this.state.activeField.selectionStart = this.state.activeField.selectionEnd = start + 1;
        }
        this.state.activeField.focus();
        return { shouldUpdateDisplay: true };
    }
}
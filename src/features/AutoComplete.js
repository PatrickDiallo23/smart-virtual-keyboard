export class AutoComplete {
    constructor(state) {
        this.state = state;
    }

    getSuggestions(text) {
        if (!this.state.autoComplete || !text) {
            return [];
        }

        const words = text.split(/\s+/);
        const lastWord = words[words.length - 1].toLowerCase();

        if (lastWord.length < 2) {
            return [];
        }

        const matches = this.state.commonWords
            .filter(w => w.startsWith(lastWord) && w !== lastWord)
            .slice(0, 5);

        return matches;
    }

    applySuggestion(currentText, suggestion) {
        const words = currentText.split(/\s+/);
        words[words.length - 1] = suggestion;
        return words.join(' ');
    }

    async loadCommonWords(wordsURL) {
        try {
            if (!wordsURL) {
                console.warn('AutoComplete: wordsURL not provided');
                return;
            }

            const response = await fetch(wordsURL);
            const text = await response.text();
            const words = text.split('\n').filter(w => w.trim().length > 0);

            if (words.length > 0) {
                this.state.commonWords = words;
                console.log(`AutoComplete: Loaded ${words.length} common words`);
            }
        } catch (err) {
            console.warn('AutoComplete: Could not load common_words.txt, using defaults', err);
        }
    }
}
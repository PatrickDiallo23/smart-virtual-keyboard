

export class SnippetExpander {
    constructor(state) {
        this.state = state;
    }

    expand(shortcut) {

        const snippet = this.state.snippets.find(s => s.shortcut === shortcut);

        if (snippet) {
            return snippet.text;
        }

        return null;
    }

    addSnippet(shortcut, text) {
        const existing = this.state.snippets.findIndex(s => s.shortcut === shortcut);

        if (existing !== -1) {
            this.state.snippets[existing] = { shortcut, text };
        } else {
            this.state.snippets.push({ shortcut, text });
        }
    }

    removeSnippet(shortcut) {
        this.state.snippets = this.state.snippets.filter(s => s.shortcut !== shortcut);
    }

    getAllSnippets() {
        return this.state.snippets;
    }

    loadSnippets(snippets) {
        if (Array.isArray(snippets)) {
            this.state.snippets = snippets;
        }
    }
}
import { KeyboardConfig } from '../core/KeyboardConfig.js';

export class AIAssistant {
    constructor(state) {
        this.state = state;
    }

    async callOpenAI(prompt, systemMessage, maxTokens = 150) {
        if (!this.state.aiConfigured) {
            throw new Error('OpenAI API key not configured. Please add your key in extension settings.');
        }

        const now = Date.now();
        if (now - this.state.lastAiRequest < KeyboardConfig.AI.RATE_LIMIT_MS) {
            throw new Error('Rate limit: Please wait a moment before making another request.');
        }

        this.state.aiLoading = true;
        this.state.lastAiRequest = now;
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'openai',
                model: this.state.aiFeatures.model,
                maxTokens,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ]
            });
            if (!response?.success) {
                throw new Error(response?.error ?? 'AI request failed');
            }
            return response.text;
        } finally {
            this.state.aiLoading = false;
        }
    }

    async proofreadText(text) {
        if (!text || text.trim().length === 0) {
            throw new Error('No text to proofread');
        }

        const systemMessage = `You are a helpful writing assistant. Proofread the given text and provide corrections for:
- Grammar errors
- Spelling mistakes
- Punctuation issues
- Clarity improvements

Return ONLY the corrected text without explanations or comments.`;

        const prompt = `Proofread this text:\n\n${text}`;

        return await this.callOpenAI(prompt, systemMessage, KeyboardConfig.AI.MAX_TOKENS.PROOFREAD);
    }

    async continueText(text) {
        if (!text || text.trim().length === 0) {
            throw new Error('No text to continue');
        }

        const systemMessage = `You are a writing assistant. Extend the provided text naturally and coherently. 
Match its tone and style. Write 1–3 sentences. 
Output only the continuation, without repeating any of the input text.`;

        const prompt = `Continue this text:\n\n${text}`;

        return await this.callOpenAI(prompt, systemMessage, KeyboardConfig.AI.MAX_TOKENS.CONTINUE);
    }

    async getSmartSuggestions(text) {
        if (!text || text.trim().length < 5) {
            return [];
        }

        const systemMessage = `You are a helpful writing assistant. Generate three short possible continuations for the given text.
Each suggestion must be under 5 words. Return only a JSON array of strings, like:
["...", "...", "..."].`;

        const prompt = `Suggest three short completions for: "${text}"`;

        try {
            const response = await this.callOpenAI(prompt, systemMessage, KeyboardConfig.AI.MAX_TOKENS.SUGGEST);
            const suggestions = JSON.parse(response);
            if (Array.isArray(suggestions)) {
                return suggestions.slice(0, 3);
            }
            return [];
        } catch (error) {
            console.warn('Could not parse AI suggestions:', error);
            return [];
        }
    }
}
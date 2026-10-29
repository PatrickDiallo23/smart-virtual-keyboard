const DEFAULTS = {
    extensionEnabled: true,
    secureInput: true,
    saveHistory: true,
    snippets: [],
    blockedSites: ''
};

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_TOKENS_CAP = 1000;

chrome.runtime.onInstalled.addListener(async () => {
    const existing = await chrome.storage.sync.get(Object.keys(DEFAULTS));
    const missing = Object.fromEntries(
        Object.entries(DEFAULTS).filter(([key]) => existing[key] === undefined)
    );
    if (Object.keys(missing).length > 0) {
        await chrome.storage.sync.set(missing);
    }
});

// The OpenAI call lives here so the API key never enters a web page's process
// and the request is not subject to the page's CSP.
async function callOpenAI({ model, messages, maxTokens }) {
    const { openaiKey } = await chrome.storage.local.get(['openaiKey']);
    if (!openaiKey?.trim()) {
        throw new Error('OpenAI API key not configured. Please add your key in extension settings.');
    }

    const response = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey.trim()}`
        },
        body: JSON.stringify({
            model: String(model),
            messages,
            max_tokens: Math.min(Number(maxTokens) || 150, MAX_TOKENS_CAP),
            temperature: 0
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error?.message ?? `API error: ${response.status}`);
    }
    return data.choices[0].message.content.trim();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action !== 'openai') return false;

    callOpenAI(message)
        .then((text) => sendResponse({ success: true, text }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep the channel open for the async response
});

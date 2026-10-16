console.log('Virtual Keyboard Component: Script executing');

import { VirtualKeyboard } from './src/core/VirtualKeyboard.js';

const getWordsUrl = () => {
    const scripts = document.querySelectorAll('script[data-words-url]');
    for (const script of scripts) {
        if (script.dataset.wordsUrl) {
            return script.dataset.wordsUrl;
        }
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL('common_words.txt');
    }

    return './common_words.txt';
};

const config = {
    wordsUrl: getWordsUrl()
};

console.log('Virtual Keyboard: Configuration:', config);

console.log('Virtual Keyboard: Creating instance...');
if (!window.vkInstance) {
    window.vkInstance = new VirtualKeyboard(config);
    console.log('Virtual Keyboard: Instance created');
} else {
    console.log('Virtual Keyboard: Instance already exists');
    if (window.vkInstance.loadSettings) {
        window.vkInstance.loadSettings().catch((err) => {
            console.warn('Virtual Keyboard: Failed to reload settings:', err);
        });
    }
    window.dispatchEvent(new Event('vk-ready'));
}

if (!window.vkDebug) {
    window.vkDebug = {
        checkSnippets: () => {
            console.log('=== SNIPPETS DEBUG ===');
            console.log('Snippets in memory:', window.vkInstance.state.snippets);
            console.log('Count:', window.vkInstance.state.snippets.length);
            if (window.vkInstance.state.snippets.length > 0) {
                window.vkInstance.state.snippets.forEach((s, i) => {
                    console.log(`  [${i}] "${s.shortcut}" => "${s.text}"`);
                });
            }
            return window.vkInstance.state.snippets;
        },

        checkStorage: async() => {
            console.log('=== STORAGE DEBUG ===');
            const data = await window.vkInstance.storageService.get(['snippets', 'blockedSites']);
            console.log('Raw storage data:', data);
            console.log('Snippets:', data.snippets);
            console.log('Blocked sites:', data.blockedSites);
            return data;
        },

        checkBlockedSites: () => {
            console.log('=== BLOCKED SITES DEBUG ===');
            console.log('Current hostname:', window.location.hostname);
            console.log('Blocked sites in memory:', window.vkInstance.state.blockedSites);
            console.log('Count:', window.vkInstance.state.blockedSites.length);

            const hostname = window.location.hostname;
            const isBlocked = window.vkInstance.state.blockedSites.some(site => {
                const cleanSite = site.toLowerCase().trim();
                const matches = hostname.includes(cleanSite) || hostname === cleanSite;
                console.log(`  "${hostname}" vs "${cleanSite}": ${matches}`);
                return matches;
            });

            console.log(`Site ${isBlocked ? 'IS' : 'IS NOT'} blocked`);
            return { hostname, blockedSites: window.vkInstance.state.blockedSites, isBlocked };
        },

        reloadSettings: async() => {
            console.log('=== FORCE RELOADING SETTINGS ===');
            await window.vkInstance.loadSettings();
            console.log('Settings reloaded!');
            console.log('Snippets now:', window.vkInstance.state.snippets);
            console.log('Blocked sites now:', window.vkInstance.state.blockedSites);
        },

        testSnippet: (shortcut) => {
            console.log('=== TESTING SNIPPET ===');
            console.log('Looking for shortcut:', shortcut);
            console.log('Available snippets:', window.vkInstance.state.snippets);

            const found = window.vkInstance.snippetExpander.expand(shortcut);
            if (found) {
                console.log('✅ FOUND:', found);
            } else {
                console.log('❌ NOT FOUND');
                console.log('Available shortcuts:', window.vkInstance.state.snippets.map(s => s.shortcut));
            }
            return found;
        },

        getState: () => {
            return {
                snippets: window.vkInstance.state.snippets,
                blockedSites: window.vkInstance.state.blockedSites,
                secureInput: window.vkInstance.state.secureInput,
                isVisible: window.vkInstance.state.isVisible,
                activeField: window.vkInstance.state.activeField,
                settingsLoaded: window.vkInstance.state.settingsLoaded
            };
        },

        addTestSnippet: (shortcut, text) => {
            const snippet = { shortcut, text };
            window.vkInstance.snippetExpander.addSnippet(shortcut, text);
            console.log('✅ Added test snippet:', snippet);
            console.log('Total snippets now:', window.vkInstance.state.snippets.length);
            return window.vkInstance.state.snippets;
        }
    };

    console.log('========================================');
    console.log('🔧 Virtual Keyboard Debug Tools Ready!');
    console.log('========================================');
    console.log('Available commands:');
    console.log('  vkDebug.checkSnippets()     - Check snippets in memory');
    console.log('  vkDebug.checkStorage()      - Check Chrome storage');
    console.log('  vkDebug.checkBlockedSites() - Check if current site is blocked');
    console.log('  vkDebug.reloadSettings()    - Force reload settings');
    console.log('  vkDebug.testSnippet(\'/lol\') - Test if a snippet exists');
    console.log('  vkDebug.getState()          - Get all current state');
    console.log('  vkDebug.addTestSnippet(\'/test\', \'Hello!\') - Add test snippet');
    console.log('========================================');
}
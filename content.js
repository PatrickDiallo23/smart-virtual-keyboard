console.log('Virtual Keyboard: Content script loaded');

chrome.storage.sync.get(['extensionEnabled'], (data) => {
    const isEnabled = data.extensionEnabled !== false;
    console.log(`Virtual Keyboard: Extension ${isEnabled ? 'enabled' : 'disabled'}`);

    if (!isEnabled) {
        console.log('Virtual Keyboard: Skipping injection because extension is disabled');
        return;
    }

    injectVirtualKeyboard();
});

function injectVirtualKeyboard() {
    if (window.vkInjected) {
        console.log('Virtual Keyboard: Already injected');
        return;
    }
    window.vkInjected = true;

    console.log('Virtual Keyboard: Injecting component...');

    const layoutsURL = chrome.runtime.getURL('keyboard-layouts.js');
    const componentURL = chrome.runtime.getURL('keyboard-component.js');
    const wordsURL = chrome.runtime.getURL('common_words.txt');

    const layoutsScript = document.createElement('script');
    layoutsScript.src = layoutsURL;
    layoutsScript.onload = function() {
        console.log('Virtual Keyboard: Layouts loaded');
        this.remove();

        const script = document.createElement('script');
        script.type = 'module';
        script.src = componentURL;
        script.dataset.wordsUrl = wordsURL;

        script.onload = function() {
            console.log('Virtual Keyboard: Component loaded successfully');
        };
        script.onerror = function() {
            console.error('Virtual Keyboard: Failed to load component');
        };

        (document.head || document.documentElement).appendChild(script);
    };
    layoutsScript.onerror = function() {
        console.error('Virtual Keyboard: Failed to load layouts');
    };

    (document.head || document.documentElement).appendChild(layoutsScript);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleExtension') {
        chrome.storage.sync.get(['extensionEnabled'], (data) => {
            const isEnabled = data.extensionEnabled !== false;
            console.log(`Virtual Keyboard: Received toggle message — now ${isEnabled ? 'enabled' : 'disabled'}`);

            if (!isEnabled) {
                window.postMessage({ type: 'vk-hide' }, '*');
            } else {
                injectVirtualKeyboard();
            }
        });
    } else if (message.action === 'settingsUpdated') {
        console.log('Virtual Keyboard: Settings updated, reloading...');
        window.postMessage({ type: 'vk-reload-settings' }, '*');
    } else if (message.action === 'storageChanged') {
        console.log('Virtual Keyboard: Storage changed:', message.key, message.value);
        window.postMessage({
            type: 'vk-storage-changed',
            key: message.key,
            value: message.value
        }, '*');
    }
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        console.log('Virtual Keyboard: Toggle shortcut pressed');
        window.postMessage({ type: 'vk-toggle' }, '*');
    }
});

window.addEventListener('message', (e) => {
    if (e.source !== window) return;

    if (e.data.type === 'VK_STORAGE_GET') {
        const requestId = e.data.requestId || 'unknown';
        console.log(`[${requestId}] Content: Getting storage for keys:`, e.data.keys);

        chrome.runtime.sendMessage({
            action: 'getStorage',
            keys: e.data.keys
        }, (response) => {
            console.log(`[${requestId}] Content: Got storage response:`, response);
            if (response && response.success) {
                window.postMessage({
                    type: 'VK_STORAGE_GET_RESPONSE',
                    requestId: requestId,
                    result: response.data
                }, '*');
            } else {
                console.error(`[${requestId}] Content: Storage get failed`);
                window.postMessage({
                    type: 'VK_STORAGE_GET_RESPONSE',
                    requestId: requestId,
                    result: {}
                }, '*');
            }
        });
    } else if (e.data.type === 'VK_STORAGE_SET') {
        console.log('Content: Setting storage:', e.data.data);
        chrome.runtime.sendMessage({
            action: 'setStorage',
            data: e.data.data
        }, (response) => {
            console.log('Content: Set storage response:', response);
            window.postMessage({
                type: 'VK_STORAGE_SET_RESPONSE',
                result: response && response.success
            }, '*');
        });
    } else if (e.data.type === 'VK_STORAGE_LOCAL_GET') {
        chrome.runtime.sendMessage({
            action: 'getLocalStorage',
            keys: e.data.keys
        }, (response) => {
            if (response && response.success) {
                window.postMessage({
                    type: 'VK_STORAGE_LOCAL_GET_RESPONSE',
                    result: response.data
                }, '*');
            }
        });
    } else if (e.data.type === 'VK_STORAGE_LOCAL_SET') {
        chrome.runtime.sendMessage({
            action: 'setLocalStorage',
            data: e.data.data
        }, (response) => {
            window.postMessage({
                type: 'VK_STORAGE_LOCAL_SET_RESPONSE',
                result: response && response.success
            }, '*');
        });
    }
});
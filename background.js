
console.log("Virtual Keyboard: Background service worker started");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Virtual Keyboard: Extension installed/updated");

    chrome.storage.sync.get(null, (data) => {
        console.log("Current storage:", data);

        const defaults = {
            extensionEnabled: true,
            secureInput: true,
            saveHistory: true,
            analytics: true,
            snippets: [],
            blockedSites: ""
        };

        const toSet = {};
        for (const [key, value] of Object.entries(defaults)) {
            if (data[key] === undefined) {
                toSet[key] = value;
            }
        }

        if (Object.keys(toSet).length > 0) {
            chrome.storage.sync.set(toSet, () => {
                console.log("Virtual Keyboard: Set default settings:", toSet);
            });
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background: Received message:", message);

    if (message.action === "getStorage") {
        chrome.storage.sync.get(message.keys, (result) => {
            console.log("Background: Returning storage:", result);
            sendResponse({ success: true, data: result });
        });
        return true;
    }

    if (message.action === "setStorage") {
        chrome.storage.sync.set(message.data, () => {
            if (chrome.runtime.lastError) {
                console.error("Background: Storage error:", chrome.runtime.lastError);
                sendResponse({
                    success: false,
                    error: chrome.runtime.lastError.message,
                });
            } else {
                console.log("Background: Storage saved successfully");
                sendResponse({ success: true });
            }
        });
        return true;
    }

    if (message.action === "getLocalStorage") {
        chrome.storage.local.get(message.keys, (result) => {
            sendResponse({ success: true, data: result });
        });
        return true;
    }

    if (message.action === "setLocalStorage") {
        chrome.storage.local.set(message.data, () => {
            if (chrome.runtime.lastError) {
                sendResponse({
                    success: false,
                    error: chrome.runtime.lastError.message,
                });
            } else {
                sendResponse({ success: true });
            }
        });
        return true;
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log(`Storage changed in ${namespace}:`, changes);

    const changedKeys = Object.keys(changes);
    console.log("Changed keys:", changedKeys);

    if (
        changedKeys.includes("snippets") ||
        changedKeys.includes("blockedSites")
    ) {
        chrome.tabs.query({}, (tabs) => {
            console.log(`Notifying ${tabs.length} tabs about storage changes`);

            tabs.forEach((tab) => {
                changedKeys.forEach((key) => {
                    if (changes[key]) {
                        chrome.tabs.sendMessage(
                            tab.id, {
                                action: "storageChanged",
                                key: key,
                                value: changes[key].newValue,
                            },
                            (response) => {
                                if (chrome.runtime.lastError) {
                                    console.log(
                                        `Tab ${tab.id} couldn't receive message:`,
                                        chrome.runtime.lastError.message
                                    );
                                } else {
                                    console.log(`Tab ${tab.id} notified about ${key} change`);
                                }
                            }
                        );
                    }
                });
            });
        });
    }
});

console.log("Virtual Keyboard: Background service worker ready");
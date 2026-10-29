// Content-script loader. The keyboard runs in the isolated world: page scripts
// cannot reach its storage, settings or AI key.
(async () => {
    if (window.vkInstance) return;
    // web_accessible_resources can't match chrome:// pages (e.g. the new tab page), so the import would fail there.
    if (!['http:', 'https:', 'file:'].includes(location.protocol)) return;

    const { extensionEnabled } = await chrome.storage.sync.get(['extensionEnabled']);
    if (extensionEnabled === false) {
        // Wait until the user enables it from the popup.
        await new Promise((resolve) => {
            chrome.storage.onChanged.addListener(function onEnable(changes, area) {
                if (area === 'sync' && changes.extensionEnabled?.newValue === true) {
                    chrome.storage.onChanged.removeListener(onEnable);
                    resolve();
                }
            });
        });
    }

    const { VirtualKeyboard } = await import(chrome.runtime.getURL('src/core/VirtualKeyboard.js'));
    const vk = new VirtualKeyboard({ wordsUrl: chrome.runtime.getURL('common_words.txt') });
    window.vkInstance = vk;

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync' || changes.openaiKey) vk.loadSettings().catch(() => {});
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key?.toLowerCase() === 'k') {
            e.preventDefault();
            vk.toggle();
        }
    });
})().catch((err) => console.error('Virtual Keyboard: failed to start', err));

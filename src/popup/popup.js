const toggle = document.getElementById("extensionToggle");
const status = document.getElementById("toggleStatus");

// Load current state
chrome.storage.sync.get(["extensionEnabled"], (data) => {
    const isEnabled = data.extensionEnabled !== false; // Default to true
    updateUI(isEnabled);
});

// Toggle on click
toggle.addEventListener("click", () => {
    const isCurrentlyActive = toggle.classList.contains("active");
    const newState = !isCurrentlyActive;

    chrome.storage.sync.set({ extensionEnabled: newState }, () => {
        updateUI(newState);

        status.textContent = newState ?
            "✓ Extension enabled" :
            "✗ Extension disabled";
        setTimeout(() => updateUI(newState), 2000);
    });
});

function updateUI(isEnabled) {
    if (isEnabled) {
        toggle.classList.add("active");
        status.textContent = "Enabled - Keyboard will appear on input fields";
    } else {
        toggle.classList.remove("active");
        status.textContent = "Disabled - Keyboard will not appear";
    }
}

document.getElementById("open-settings").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
});
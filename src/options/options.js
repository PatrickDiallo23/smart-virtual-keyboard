let snippets = [];
let clipboardHistory = [];

// Load all settings on page load
document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    loadSnippets();
    loadClipboardHistory();

    // Add event listeners for buttons
    document.getElementById("add-snippet-btn").addEventListener("click", addSnippet);
    document.getElementById("clear-clipboard-btn").addEventListener("click", clearClipboardHistory);
    document.getElementById("reset-settings-btn").addEventListener("click", resetAllSettings);
    document.getElementById("cancel-btn").addEventListener("click", () => window.close());
    document.getElementById("save-btn").addEventListener("click", saveSettings);
});

function loadSettings() {
    chrome.storage.sync.get(
        [
            "openaiKey",
            "aiModel",
            "secureInput",
            "saveHistory",
            "analytics",
            "blockedSites",
            "autofillName",
            "autofillEmail",
            "autofillPhone",
            "autofillCompany",
            "autofillAddress",
        ],
        (data) => {
            // API Configuration
            if (data.openaiKey) {
                document.getElementById("openai-key").value = data.openaiKey;
            }

            if (data.aiModel) {
                document.getElementById("ai-model").value = data.aiModel;
            }

            // Security & Privacy
            document.getElementById("secure-input").checked =
                data.secureInput !== false;
            document.getElementById("save-history").checked =
                data.saveHistory !== false;
            document.getElementById("analytics").checked = data.analytics !== false;

            if (data.blockedSites) {
                document.getElementById("blocked-sites").value = data.blockedSites;
            }

            // Form Auto-Fill
            if (data.autofillName)
                document.getElementById("autofill-name").value = data.autofillName;
            if (data.autofillEmail)
                document.getElementById("autofill-email").value = data.autofillEmail;
            if (data.autofillPhone)
                document.getElementById("autofill-phone").value = data.autofillPhone;
            if (data.autofillCompany)
                document.getElementById("autofill-company").value =
                data.autofillCompany;
            if (data.autofillAddress)
                document.getElementById("autofill-address").value =
                data.autofillAddress;
        }
    );
}

function loadSnippets() {
    chrome.storage.sync.get(["snippets"], (data) => {
        if (data.snippets && Array.isArray(data.snippets)) {
            snippets = data.snippets;
            console.log("Options: Loaded snippets from storage:", snippets);
        } else {
            snippets = [
                { shortcut: "/email", text: "your.email@example.com" },
                { shortcut: "/phone", text: "+1 234 567 8900" },
                { shortcut: "/addr", text: "123 Main St, City, State 12345" },
            ];
            console.log("Options: Using default snippets");
        }
        renderSnippets();
    });
}

function renderSnippets() {
    const list = document.getElementById("snippet-list");

    if (snippets.length === 0) {
        list.innerHTML =
            '<p style="color: #999; text-align: center; padding: 20px;">No snippets yet. Add one below!</p>';
        return;
    }

    list.innerHTML = snippets
        .map(
            (snippet, index) => `
    <div class="snippet-item">
      <div class="snippet-shortcut">${escapeHtml(snippet.shortcut)}</div>
      <div class="snippet-text">${escapeHtml(snippet.text)}</div>
      <button class="snippet-delete" data-index="${index}">Delete</button>
    </div>
  `).join("");

    list.querySelectorAll(".snippet-delete").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.target.getAttribute("data-index"));
            deleteSnippet(index);
        });
    });
}

function addSnippet() {
    const shortcut = document.getElementById("new-snippet-shortcut").value.trim();
    const text = document.getElementById("new-snippet-text").value.trim();

    if (!shortcut || !text) {
        alert("Please enter both shortcut and text");
        return;
    }

    if (!shortcut.startsWith("/")) {
        alert("Shortcuts must start with /");
        return;
    }

    // Check for duplicates
    if (snippets.some((s) => s.shortcut === shortcut)) {
        alert("This shortcut already exists");
        return;
    }

    snippets.push({ shortcut, text });

    // Clear inputs
    document.getElementById("new-snippet-shortcut").value = "";
    document.getElementById("new-snippet-text").value = "";

    renderSnippets();

    // Auto-save
    chrome.storage.sync.set({ snippets }, () => {
        console.log("Options: Snippet saved to storage:", snippets);
        showSuccessMessage();
    });
}

function deleteSnippet(index) {
    if (confirm("Delete this snippet?")) {
        snippets.splice(index, 1);
        renderSnippets();
        chrome.storage.sync.set({ snippets }, () => {
            console.log("Options: Snippets updated after deletion");
        });
    }
}

function loadClipboardHistory() {
    chrome.storage.local.get(["clipboardHistory"], (data) => {
        clipboardHistory = data.clipboardHistory || [];
        renderClipboardHistory();
    });
}

function renderClipboardHistory() {
    const container = document.getElementById("clipboard-history");

    if (clipboardHistory.length === 0) {
        container.innerHTML =
            '<p style="color: #999; text-align: center; padding: 20px;">No clipboard history yet</p>';
        return;
    }

    container.innerHTML = clipboardHistory
        .slice(0, 20)
        .map((item, index) => {
            const preview =
                item.text.length > 80 ? item.text.substring(0, 80) + "..." : item.text;
            const timeAgo = getTimeAgo(item.timestamp);

            return `
      <div class="clipboard-item" data-index="${index}" data-text="${escapeHtml(item.text)}">
        <div class="clipboard-preview">${escapeHtml(preview)}</div>
        <div class="clipboard-time">${timeAgo}</div>
      </div>
    `;
        }).join("");

    container.querySelectorAll(".clipboard-item").forEach((item) => {
        item.addEventListener("click", (e) => {
            const text = e.currentTarget.getAttribute("data-text");
            const index = parseInt(e.currentTarget.getAttribute("data-index"));
            copyToClipboard(text, index);
        });
    });
}

function copyToClipboard(text, index) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    const decodedText = textarea.value;

    navigator.clipboard.writeText(decodedText).then(() => {
        // Show feedback
        const items = document.querySelectorAll(".clipboard-item");
        if (items[index]) {
            const original = items[index].style.background;
            items[index].style.background = "#28a745";
            items[index].style.color = "white";
            setTimeout(() => {
                items[index].style.background = original;
                items[index].style.color = "";
            }, 500);
        }
    });
}

function clearClipboardHistory() {
    if (confirm("Clear all clipboard history?")) {
        clipboardHistory = [];
        chrome.storage.local.set({ clipboardHistory: [] });
        renderClipboardHistory();
    }
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
}

function saveSettings() {
    const settings = {
        // API Configuration
        openaiKey: document.getElementById("openai-key").value,
        aiModel: document.getElementById("ai-model").value,

        // Security & Privacy
        secureInput: document.getElementById("secure-input").checked,
        saveHistory: document.getElementById("save-history").checked,
        analytics: document.getElementById("analytics").checked,
        blockedSites: document.getElementById("blocked-sites").value,

        // Form Auto-Fill
        autofillName: document.getElementById("autofill-name").value,
        autofillEmail: document.getElementById("autofill-email").value,
        autofillPhone: document.getElementById("autofill-phone").value,
        autofillCompany: document.getElementById("autofill-company").value,
        autofillAddress: document.getElementById("autofill-address").value,

        // Snippets (already saved individually)
        snippets: snippets,
    };

    chrome.storage.sync.set(settings, () => {
        console.log("Options: Settings saved", settings);
        showSuccessMessage();

        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                chrome.tabs.sendMessage(
                    tab.id, { action: "settingsUpdated" },
                    () => {
                        if (chrome.runtime.lastError) {
                            // Ignore errors for tabs that can't receive messages
                        }
                    }
                );
            });
        });
    });
}

function showSuccessMessage() {
    const msg = document.getElementById("success-message");
    msg.style.display = "block";
    setTimeout(() => {
        msg.style.display = "none";
    }, 3000);
}

function resetAllSettings() {
    if (
        confirm(
            "Are you sure? This will delete all your settings, snippets, and clipboard history."
        )
    ) {
        if (confirm("Really sure? This cannot be undone!")) {
            chrome.storage.sync.clear();
            chrome.storage.local.clear();
            location.reload();
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
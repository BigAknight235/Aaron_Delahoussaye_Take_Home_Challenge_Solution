// background.js
console.log("Hello from background script : )");

// Listener for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Telegram Disappearing Photo Sender installed/updated.");
  // Create a context menu item to trigger the functionality
  chrome.contextMenus.create({
    id: "sendDisappearingPhoto",
    title: "Send Disappearing Photo (5s)",
    contexts: ["page", "selection", "image", "video", "audio", "link"], // Show on various elements
    documentUrlPatterns: ["https://web.telegram.org/a/*"] // Only show on Telegram Web A
  });
});

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendDisappearingPhoto" && tab.url.startsWith("https://web.telegram.org/a")) {
    console.log("Context menu item clicked. Sending message to content script.");
    // Send a message to the content script in the active tab to initiate the process
    chrome.tabs.sendMessage(tab.id, { action: "triggerDisappearingPhoto" })
      .then(response => {
        if (response && response.status) {
          console.log("Content script response:", response.status);
        }
      })
      .catch(error => {
        console.error("Error sending message to content script:", error);
      });
  }
});

// Listener for clicks on the extension's toolbar icon
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.startsWith("https://web.telegram.org/a")) {
    console.log("Extension icon clicked. Sending message to content script.");
    try {
      // Send a message to the content script in the active tab
      await chrome.tabs.sendMessage(tab.id, { action: "triggerDisappearingPhoto" });
      console.log("Message sent to content script to initiate photo sending.");
    } catch (error) {
      console.error("Failed to send message to content script:", error);
      // Handle cases where content script might not be injected yet
      // or other communication errors.
      // A common error is "Could not establish connection. Receiving end does not exist."
      // This often means the content script hasn't fully loaded or been injected.
      // For resilience, you might try executing a script directly to ensure listener exists.
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"] // Re-inject or ensure content.js is present
      }, () => {
        chrome.tabs.sendMessage(tab.id, { action: "triggerDisappearingPhoto" })
          .catch(err => console.error("Retry failed:", err));
      });
    }
  } else {
    console.warn("Active tab is not Telegram Web A. Cannot send disappearing photo.");
    // Optionally, open Telegram Web A or show a notification
    chrome.tabs.create({ url: "https://web.telegram.org/a" });
  }
});

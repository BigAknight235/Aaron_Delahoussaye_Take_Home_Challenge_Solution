// content.js
console.log("Hello from content script :)");

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "triggerDisappearingPhoto") {
    console.log("Content script received trigger to send disappearing photo.");
    // Initiate the process to select/generate a photo and send it with a timer
    try {
      sendDisappearingPhotoWithTimer(5); // Send with a 5-second timer
      // Important: sendResponse is called after sendDisappearingPhotoWithTimer completes
      // so we need to return true to keep the message channel open.
      // The actual status would ideally be sent from within sendDisappearingPhotoWithTimer
      // or after its awaited completion. For this example, it's immediately sent.
      sendResponse({ status: "Disappearing photo process initiated (check console for details)." });
    } catch (e) {
      console.error("Error initiating disappearing photo process:", e);
      sendResponse({ status: "Error initiating photo process." });
    }
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});

// Function to find the user's own chat ID (Saved Messages)
function findSelfChatId() {
  // 1. Attempt to extract from the URL fragment (e.g., web.telegram.org/a/#123456789)
  const urlMatch = window.location.hash.match(/^#(\d+)$/);
  if (urlMatch && urlMatch) { // Access the captured group
    console.log("Found self chat ID from URL fragment:", urlMatch);
    return parseInt(urlMatch);
  }

  // 2. Attempt to find a "Saved Messages" link in the DOM and extract its ID
  // These selectors are still HYPOTHETICAL and need real-world verification
  // in web.telegram.org/a's DOM structure.
  const savedMessagesLink = document.querySelector('a, div'); // More generic link or div with peer-id
  if (savedMessagesLink) {
    const linkMatch = savedMessagesLink.href ? savedMessagesLink.href.match(/messages\/(\d+)$/) : null;
    if (linkMatch && linkMatch) { // Access the captured group
      console.log("Found self chat ID from Saved Messages link:", linkMatch);
      return parseInt(linkMatch);
    }
    // If it's a div, check its attributes or children for an ID
    if (savedMessagesLink.dataset.peerId) { // Hypothetical data attribute
        console.log("Found self chat ID from data-peer-id attribute:", savedMessagesLink.dataset.peerId);
        return parseInt(savedMessagesLink.dataset.peerId);
    }
  }

  console.error("Could not determine self chat ID dynamically. Please ensure you are in 'Saved Messages' chat or adapt `findSelfChatId` for your Telegram Web A version by inspecting the DOM.");
  return null; // Return null if unable to find
}

// Main function to send a disappearing photo
async function sendDisappearingPhotoWithTimer(timerSeconds) {
  const selfChatId = findSelfChatId();
  if (!selfChatId) {
    alert("Could not determine your 'Saved Messages' chat ID. Please navigate to 'Saved Messages' first.");
    return;
  }

  // 1. Programmatically generate a simple photo Blob
  const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#${Math.floor(Math.random()*16777215).toString(16)}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="#ffffff">Self-Destruct in ${timerSeconds}s</text></svg>`;
  // Fix 1: line 68, col 30 - new Blob() expects an array as its first argument
  const photoBlob = new Blob(, { type: 'image/svg+xml' });
  console.log("Generated photo Blob:", photoBlob);

  console.log("Simulating UI interactions...");

  // Try to find the attachment icon and click it
  // These selectors are HYPOTHETICAL and need verification from Telegram Web A's DOM.
  const attachButton = document.querySelector('.icon-attach, button, button.attach-button');
  if (!attachButton) {
    console.error("Attachment button not found. UI simulation failed.");
    alert("Could not find Telegram's attachment button. UI structure might have changed.");
    return;
  }
  attachButton.click();
  console.log("Clicked attachment button.");

  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UI to react

  // Find the hidden file input element (it's often part of the attachment menu)
  // These selectors are HYPOTHETICAL.
  const fileInput = document.querySelector('input, .input-file-container input');
  if (!fileInput) {
    console.error("File input element not found. UI simulation failed.");
    alert("Could not find the file input for attaching media. UI structure might have changed.");
    return;
  }

  const dataTransfer = new DataTransfer();
  // Fix 2: line 96, col 25 - new File() expects an array as its first argument (for BlobParts)
  const file = new File(, `disappearing_photo_${Date.now()}.svg`, { type: photoBlob.type });
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;

  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  console.log("Dispatched change event on file input with generated photo.");

  await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for preview screen to load

  // *** CRITICAL REVERSE ENGINEERING REQUIRED HERE ***
  // Find the exact selector for the clock icon / timer setting UI element
  // on the photo preview screen of web.telegram.org/a.
  // This is the most unstable part and will definitely require you to inspect
  // the live DOM of web.telegram.org/a during the photo preview stage.
  const timerIcon = document.querySelector('.media-panel-timer-icon, .icon-timer, .tgico-timer, button, div.timer-controls'); // HYPOTHETICAL selectors
  if (timerIcon) {
    timerIcon.click();
    console.log("Clicked the timer icon.");

    await new Promise(resolve => setTimeout(resolve, 300)); // Delay for timer options to appear

    // Find the option for '5 seconds' within the timer menu that appears.
    // This is also HYPOTHETICAL and needs live DOM inspection.
    const fiveSecondOption = document.querySelector(`, .timer-option-${timerSeconds}, div.menu-item-timer`);
    if (fiveSecondOption) {
      fiveSecondOption.click();
      console.log(`Set timer to ${timerSeconds} seconds.`);
    } else {
      console.warn(`5-second timer option not found (value: ${timerSeconds}). Disappearing photo may not be set.`);
      alert("Could not find the 5-second timer option. Disappearing photo might not work.");
    }
  } else {
    console.warn("Timer icon not found on the media preview screen. Disappearing photo might not be activatable via UI simulation.");
    alert("Could not find the self-destruct timer icon on Telegram's media preview. The feature may not work.");
  }

  await new Promise(resolve => setTimeout(resolve, 500)); // Final delay before sending

  // Find and click the send button
  // These selectors are HYPOTHETICAL.
  const sendButton = document.querySelector('.btn-send, button.send, .composer-send-button, button, button');
  if (sendButton) {
    sendButton.click();
    console.log("Clicked send button. Photo should be sent.");
  } else {
    console.error("Send button not found. Photo not sent.");
    alert("Could not find the send button. Photo sending failed.");
  }
}

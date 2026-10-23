/**
 * Promptly — Chrome Extension Background Service Worker (Manifest V3)
 * -------------------------------------------------------------------
 * Manages extension lifecycle, authentication token storage, and background
 * API dispatch for Promptly.
 */

/* global chrome */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Promptly Extension] Installed successfully.');
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROMPTLY_PING') {
    sendResponse({ status: 'ok', version: '0.1.0' });
    return true;
  }

  if (message.type === 'PROMPTLY_GET_AUTH') {
    chrome.storage.local.get(['promptly_session'], (result) => {
      sendResponse({ session: result.promptly_session || null });
    });
    return true; // Keep message channel open for async response
  }
});

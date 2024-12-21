'use strict';

import { isValidMessage, type MessageHandler } from './util/message_handler';

const BEAR_VALLEY_ORIGIN = 'https://cali-pass.control-room.te2.io';

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) return;
    const url: URL = new URL(tab.url);
    // Enables the side panel on google.com
    if (url.origin === BEAR_VALLEY_ORIGIN) {
        await chrome.sidePanel.setOptions({
            tabId,
            path: 'sidepanel.html',
            enabled: true,
        });
    } else {
        // Disables the side panel on all other sites
        await chrome.sidePanel.setOptions({
            tabId,
            enabled: false,
        });
    }
});

const forwardedMessages = ['applyChange', 'getTrailData'];
const handleMessages: MessageHandler = function (
    message,
    sender,
    sendResponse
) {
    if (!isValidMessage(message)) {
        return false;
    }
    if (forwardedMessages.indexOf(message.type) !== -1) {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                if (tabs.length !== 0 && tabs[0].id !== undefined) {
                    chrome.tabs.sendMessage(tabs[0].id, message, sendResponse!);
                }
            }
        );
        return true;
    }

    return false;
};

chrome.runtime.onMessage.addListener(handleMessages);

export {};

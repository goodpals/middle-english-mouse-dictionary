/// the background/service worker is to handle events, manage data, and perform actions that don’t require direct user interaction.

/// I don't think we need a background task rn; we don't need to respond to events that occur outside of the current tab.

// chrome.action.onClicked.addListener(function(tab) {
//   chrome.tab.executeScript(tab.id, {file: "content.js"});
// });

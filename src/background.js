/// TODO: Alex: I don't think we need this; we don't need to respond to events that occur outside of the current tab. Opin?

chrome.action.onClicked.addListener(function(tab) {
  chrome.tab.executeScript(tab.id, {file: "content.js"});
});


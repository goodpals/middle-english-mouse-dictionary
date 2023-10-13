chrome.action.onClicked.addListener(function(tab) {
  chrome.tab.executeScript(tab.id, {file: "content.js"});
});


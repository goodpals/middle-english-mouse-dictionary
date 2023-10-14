/// the background/service worker is to handle events, manage data, and perform actions that don’t require direct user interaction.

chrome.runtime.onInstalled.addListener(() => {
  /// PROBLEM: the log isn't showing but the state HAS been set
  chrome.storage.local.set({ state: 'on' });
  chrome.storage.local.get('state', (result) => {
    console.log('SETUP: STATE is currently ' + result.state);
  });
});


/// This is actioned when the user presses the extension button in the Chrome toolbar.
/// PROBLEM: this works once changing the state from ON to OFF and then stops working.
chrome.action.onClicked.addListener(function(tab) {
  console.log("clicked");
  chrome.storage.local.get('state', (result) => {
    if (result.state == 'on') {
      chrome.storage.local.set({state: 'off'});
      console.log("turned off");
    } else {
      console.storage.local.set({state: 'on'});
      console.log("turned on");
    }
  });
});


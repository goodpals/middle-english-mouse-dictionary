/* the background/service worker is to handle events, manage data, and perform actions that don’t require direct user interaction. */

/// STORAGE.LOCAL: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
/// CONTEXT MENUS: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus

! async function setStateFirstTime(){  
  await browser.storage.local.set({ 
    onOffState: 'on', 
    userWordList: [], 
    dictionaryChoice: 'mouse',
    // wordListViewState: 'off' 
  });
}();


/// Construct options for an in-browser right-click menu and build their text content based off the initial state set above.
browser.runtime.onInstalled.addListener( async () => {

  const extensionState = await browser.storage.local.get(); /// gets all. not supported in safari

  browser.contextMenus.create({
    id: "functionalityToggler",
    title: (extensionState.onOffState == 'on' ? 'turn off' : 'turn on'),
    contexts: ["all"],
  });
  browser.contextMenus.create({
    id: "wordListSidebarToggler",
    // title: (extensionState.wordListViewState == 'on' ? 'hide dictionary' : 'show dictionary'),
    title: "show dictionary",
    contexts: ["all"],
  });
  browser.contextMenus.create({
    id: "dictionarySelector",
    title: (extensionState.dictionaryChoice == 'mouse' ? 'query MED website' : 'use mouse dictionary'),
    contexts: ["all"],
  });
  browser.contextMenus.create({
    id: "selectionOption",
    title: "Do a selected text thing(?)",
    contexts: ["selection"],
  });
});


/*  CONTEXTMENU LISTENER: 
    1. Changes the state held in browser storage when one of the above menu items are clicked
    2. Updates the menu items' text based on that state. 
    3. Makes relevant custom functionality happen                                     
*/
browser.contextMenus.onClicked.addListener(async (info, tab) => {

  const currentState = await browser.storage.local.get();
  if (info.menuItemId === "functionalityToggler") 
  {
    const newState = currentState.onOffState == 'on' ? 'off' : 'on';
    await browser.storage.local.set({onOffState: newState});
    browser.contextMenus.update("functionalityToggler", {
      title: (newState == 'on' ? 'turn off' : 'turn on'),
    });
  } 
  else if (info.menuItemId === "dictionarySelector") 
  {
    const newState = currentState.dictionaryChoice == 'mouse' ? 'MED' : 'mouse';
    await browser.storage.local.set({dictionaryChoice: newState});
    browser.contextMenus.update("dictionarySelector", {
      title: (newState == 'mouse' ? 'query MED website' : 'use mouse dictionary'),
    });
  } 
  else if (info.menuItemId === "wordListSidebarToggler") 
  {
    console.log('sidebar toggle')
    /// TODO: sort out tab behaviour e.g. what if they click the "open dictionary" contextMenu button when it's already open?
    // const newState = currentState.wordListViewState == 'on' ? 'off' : 'on';
    // await browser.storage.local.set({wordListViewState: newState});

    await browser.tabs.sendMessage(tab.id, {action: "showWordList"}); /// see: userWordListSidebar.js
  }
});


/// If the user has used dictionarySelector to search MED website entries, this will construct a URL upon receipt of a message from content.js and open the query in a new tab
browser.runtime.onMessage.addListener(async function(message) {
  /// TODO?: if search_field is "hnf" that just checks headwords with alt spellings on MED; if it's "anywhere", it searches whole entries. This is a crapshoot option but might be worth giving the choice.
  const MED_URL = 'https://quod.lib.umich.edu/m/middle-english-dictionary/dictionary?utf8=✓&search_field=hnf&q=';  
  const completeURL = MED_URL + message.word;

  let createTab = browser.tabs.create({
    url: completeURL,
    active: true,
  });
});

async function getResource(path) {
  let URL = browser.runtime.getURL(path);
  const response = await fetch(URL);
  const result = await response.json();
  return result;
}

const dictionary = await getResource('data/dict.json');
console.log('MEMD: Dictionary loaded, length: ' + Object.keys(dictionary).length);
const lookup = await getResource('data/lookup.json');
console.log('MEMD: Lookup table loaded, length: ' + Object.keys(lookup).length);

browser.storage.local.set({dictionary, lookup});
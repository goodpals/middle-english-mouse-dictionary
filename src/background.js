/* 
  the background/service worker is to handle events, manage data, and perform actions that don’t require direct user interaction.
*/

/// STORAGE.LOCAL: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
/// CONTEXT MENUS: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus

! async function setStateFirstTime(){  
  await browser.storage.local.set({ 
    onOffState: 'on', 
    userWordList: [], 
    currentlySelectedText: '',
    // wordListViewState: 'off' 
  });
}();


/** RIGHT-CLICK CONTEXTMENU BUILDER
 * Construct options for an in-browser right-click menu and build their text content based off the initial state set above.
 */
! async function buildContextMenu() {
    const extensionState = await browser.storage.local.get(); /// gets all. not supported in safari

    browser.contextMenus.create({
      id: "functionalityToggler",
      title: (extensionState.onOffState == 'on' ? 'turn off' : 'turn on'),
      contexts: ["all"],
    });
    browser.contextMenus.create({
      id: "wordListSidebarToggler",
      title: "open saved words sidebar",
      contexts: ["all"],
    });
    browser.contextMenus.create({
      id: "externalWebDictionary",
      title: "Query selected text on online dictionary",
      contexts: ["selection"],
    });
}();



/** RIGHT-CLICK CONTEXTMENU LISTENER
 * 1. Listens for one of the menu items being clicked.
 * 2. Changes the state held in browser storage in response.
 * 3. Updates the menu items' text based on that state. 
 * 4. Makes relevant custom functionality happen           
 */
! async function addContextMenuListener() {
  browser.contextMenus.onClicked.addListener(async (info, tab) => {

    const currentState = await browser.storage.local.get();
    if (info.menuItemId === "functionalityToggler") {
      const newState = currentState.onOffState == 'on' ? 'off' : 'on';
      await browser.storage.local.set({onOffState: newState});
      browser.contextMenus.update("functionalityToggler", {
        title: (newState == 'on' ? 'turn off' : 'turn on'),
      });
    } 
    else if (info.menuItemId === "wordListSidebarToggler") {
      await browser.tabs.sendMessage(tab.id, {action: "showWordList"}); /// see: sidebar.js
    }
    else if (info.menuItemId === "externalWebDictionary") {
      openExternalDictionaryQuery();
    }
  });
}();



/** INSTANTIATE DICTIONARY OBJECTS
 * Extract extension-packaged dictionary files from their storage addresses, and pass them into k:v pair-based local storage setter.
 * These cannot be accessed directly by content.js; they must be first instantiated in background.js and then loaded into content.js specific global variables by means of a local-storage getter function.
 * see: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources
 */
! async function loadDictionariesIntoLocalStorage() {
  const dictionary = await getResource('data/dict.json');
  // console.log('MEMD: Dictionary loaded, length: ' + Object.keys(dictionary).length);
  
  const lookup = await getResource('data/lookup.json');
  // console.log('MEMD: Lookup table loaded, length: ' + Object.keys(lookup).length);

  browser.storage.local.set({dictionary, lookup});
}();



/*
  MISCELLANEOUS HELPERS
*/

async function getResource(path) {
  let URL = browser.runtime.getURL(path);
  const response = await fetch(URL);
  const result = await response.json();
  return result;
}


async function openExternalDictionaryQuery() {
  const res = await browser.storage.local.get();
  const query = res.currentlySelectedText;
  const MED_URL = 'https://quod.lib.umich.edu/m/middle-english-dictionary/dictionary?utf8=✓&search_field=anywhere&q=';  
  const completeURL = MED_URL + query;

  let createTab = browser.tabs.create({
    url: completeURL,
    active: true,
  });
}

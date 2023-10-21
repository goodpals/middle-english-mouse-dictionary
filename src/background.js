/* the background/service worker is to handle events, manage data, and perform actions that don’t require direct user interaction. */

/// STORAGE.LOCAL: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
/// CONTEXT MENUS: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus

! async function setStateFirstTime(){  
  await browser.storage.local.set({ 
    onOffState: 'on', 
    userDictionary: [], 
    // dictionaryViewState: 'off' 
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
    id: "dictionaryShowToggler",
    // title: (extensionState.dictionaryViewState == 'on' ? 'hide dictionary' : 'show dictionary'),
    title: "show dictionary",
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
  else if (info.menuItemId === "dictionaryShowToggler") 
  {
    /// TODO: sort out tab behaviour e.g. what if they click the "open dictionary" contextMenu button when it's already open?
    // const newState = currentState.dictionaryViewState == 'on' ? 'off' : 'on';
    // await browser.storage.local.set({dictionaryViewState: newState});

    browser.tabs.sendMessage(tab.id, {action: "showTheDictionary"}); /// see: popupDictionary.js
  }
});


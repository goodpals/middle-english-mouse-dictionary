/* the background/service worker is to handle events, manage data, and perform actions that don’t require direct user interaction. */

! async function setStateFirstTime(){  
  /// STORAGE.LOCAL: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
  await browser.storage.local.set({ onOffState: 'on' }); /// TODO: add error checks as per example in ^^
  await browser.storage.local.set({ dictionaryContent: [] });
  await browser.storage.local.set({ dictionaryViewState: 'off' });

}();

/// Construct options for an in-browser right-click menu and build their text content based off the initial state set above.
browser.runtime.onInstalled.addListener( async () => {

  const extensionState = await browser.storage.local.get('onOffState');
  browser.contextMenus.create({
    id: "functionalityToggler",
    title: (extensionState.onOffState == 'on' ? 'turn off' : 'turn on'),
    contexts: ["all"], /// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/ContextType
  });

  const dictionaryState = await browser.storage.local.get('dictionaryViewState');
  browser.contextMenus.create({
    id: "dictionaryShowToggler",
    title: (dictionaryState.dictionaryViewState == 'on' ? 'hide dictionary' : 'show dictionary'),
    contexts: ["all"], /// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/ContextType
  });

  browser.contextMenus.create({
    id: "selectionOption",
    title: "Do a selected text thing(?)",
    contexts: ["selection"],
  });
});


/*  This listener: 
    1. Changes the state held in browser storage when one of the above menu items are clicked
    2. Updates the menu items' text based on that state. 
    3. Makes relevant custom functionality happen                                     
*/
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "functionalityToggler") 
  {
    const currentState = await browser.storage.local.get('onOffState');
    const newState = currentState.onOffState == 'on' ? 'off' : 'on';
    await browser.storage.local.set({onOffState: newState});
    browser.contextMenus.update("functionalityToggler", {
      title: (newState == 'on' ? 'turn off' : 'turn on'),
    });
  } 
  else if (info.menuItemId === "dictionaryShowToggler") 
  {
    const currentState = await browser.storage.local.get('dictionaryViewState');
    const newState = currentState.dictionaryViewState == 'on' ? 'off' : 'on';
    await browser.storage.local.set({dictionaryViewState: newState});
    browser.contextMenus.update("dictionaryShowToggler", {
      title: (newState == 'on' ? 'hide dictionary' : 'show dictionary'),
    });
    /// TODO: show dictionary iff newState is ON
  }
});


/// TODO: make this; adapt to insert defined .HTML file and inject code into it.
// async function showDictionaryInBrowser() {
//   const currentState = await browser.storage.local.get('dictionaryContent');
//   let content = Array.from(currentState.dictionaryContent);  
//   let popup = document.createElement('div');
//   popup.className = 'dictionaryPopup';
//   popup.innerText = info;

//   popup.style.position = 'absolute';
//   popup.style.left = (event.clientX + window.scrollX - 100) + 'px';
//   popup.style.top = (event.clientY + window.scrollY + 15) + 'px';

//   document.body.appendChild(popup);

//   document.addEventListener('click', function(event) {
//     document.removeEventListener('click', this);
//     popup.remove();
//   });

//   // setTimeout(function() { popup.remove(); }, 3000); /// alt option but don't like it
// }

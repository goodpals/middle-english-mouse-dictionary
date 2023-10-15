/* the background/service worker is to handle events, manage data, and perform actions that don’t require direct user interaction. */

! async function setStateFirstTime(){  
  await browser.storage.local.set({ state: 'on' });
  await browser.storage.local.set({ sidebar : 'off' });
}();

/// Construct options for an in-browser right-click menu and build their text content based off the initial state set above.
browser.runtime.onInstalled.addListener( async () => {

  const currentState = await browser.storage.local.get('state');
  browser.contextMenus.create({
    id: "functionalityToggler",
    title: (currentState.state == 'on' ? 'turn off' : 'turn on'),
    contexts: ["all"], /// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/ContextType
  });

  const currentSidebar = await browser.storage.local.get('sidebar');
  browser.contextMenus.create({
    id: "configMenuToggler",
    title: (currentSidebar.sidebar == 'on' ? 'close sidebar' : 'open sidebar'),
    contexts: ["all"],
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
    const currentState = await browser.storage.local.get('state');
    const newState = currentState.state == 'on' ? 'off' : 'on';
    await browser.storage.local.set({state: newState});
    // const checkmark = newState == 'on' ? true : false;
    browser.contextMenus.update("functionalityToggler", {
      title: (newState == 'on' ? 'turn off' : 'turn on'),
    });
  }
  else if (info.menuItemId === "configMenuToggler") 
  {
    const currentState = await browser.storage.local.get('sidebar');
    const newState = currentState.sidebar == 'open' ? 'closed' : 'open';
    await browser.storage.local.set({sidebar: newState});
    
    /// TODO: tried following docs to make poppable sidebar: cannot figure out. Reverted to this for now.
    /// SEE:  https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/User_actions
    // if (newState == 'open') {
    //   browser.sidebarAction.open();
    // } else ......

    browser.contextMenus.update("configMenuToggler", {
      title: (newState == 'open' ? 'close sidebar' : 'open sidebar'),
    });
  }
});

/// TODO: figure out why can't send info to sidebar
/// SEE:  dblclick event listener in content.js for update function call
// browser.runtime.onMessage.addListener((message) => {
//   if (message.action === "updateSidebar") {
//     const dynamicContent = document.getElementById("dynamicContent");
//     dynamicContent.innerHTML += `<p>${message.data}</p>`;
//   }
// });
// //
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === 'updateSidebar') {
//     chrome.action.setPanel({ panel: 'sidebar.html' });
//   }
// });

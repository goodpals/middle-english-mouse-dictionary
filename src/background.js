/* the background/service worker is to handle events, manage data, and perform actions that don’t require direct user interaction. */
/// console.logs don't seem to work here, but necessary to run these operations from the background task

! async function setStateFirstTime(){  
  await browser.storage.local.set({ state: 'on' });
  // const result = await browser.storage.local.get('state');
  // console.log("setup on tabload: extension is " + result.state);
}();

/// Make the right-click menu that has an option to enable/disable functionality. 
/// This way extension is "enabled" in the extension manager, but our functionality "soft locked" via a rClick menu.
browser.runtime.onInstalled.addListener(async () => {
  const currentState = await browser.storage.local.get('state');
  browser.contextMenus.create({
    id: "rightClickOptionsMenu",
    title: "Middle English: " + (currentState.state == 'on' ? 'turn off' : 'turn on'),
    contexts: ["all"], /// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/ContextType
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "rightClickOptionsMenu") {

    const currentState = await browser.storage.local.get('state');
    const newState = currentState.state == 'on' ? 'off' : 'on';
    await browser.storage.local.set({state: newState});
    // const checkmark = newState == 'on' ? true : false;
    browser.contextMenus.update("rightClickOptionsMenu", {
      title: "Middle English: " + (newState == 'on' ? 'turn off' : 'turn on'),
      // checked: !info.checked,
    });
  }
});



// const currentState = await browser.storage.local.get('state');
//     console.log("current: " + currentState.state);

//     const newState = currentState.state == 'on' ? 'off' : 'on';
//     await browser.storage.local.set({state: newState});

//     const checkStateChange = await browser.storage.local.get('state');
//     console.log("turned: " + checkStateChange.state);
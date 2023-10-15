/// at least for now, turn on (enable extension functionality) when the webpage is first loaded
! async function setStateFirstTime(){  
  await browser.storage.local.set({ state: 'on' });
  const result = await browser.storage.local.get('state');
  console.log("setup on tabload: extension is " + result.state);
}();

/// Just as a test for now: enable or disable the extension functionality with the letter D 
document.addEventListener('keydown', async function(event) {
  if(event.key.toLowerCase() === "d") {
    console.log("The letter D was pressed: disabling extension functionality");
    const currentState = await browser.storage.local.get('state');
    if (currentState.state == 'on') {
        await browser.storage.local.set({state: 'off'});
      } else {
        await browser.storage.local.set({state: 'on'});
      }
    const newState = await browser.storage.local.get('state');
    console.log("turned " + newState.state);
  }
});
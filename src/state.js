/// Just as a test for now: enable or disable the extension functionality with the letter D 
// document.addEventListener('keydown', async function(event) {
//   if(event.key.toLowerCase() === "d") {
//     console.log("The letter D was pressed: disabling extension functionality");

//     const currentState = await browser.storage.local.get('state');
//     console.log("current: " + currentState.state);

//     const newState = currentState.state == 'on' ? 'off' : 'on';
//     await browser.storage.local.set({state: newState});

//     const checkStateChange = await browser.storage.local.get('state');
//     console.log("turned: " + checkStateChange.state);
//   }
// });

/* 
  USER DICTIONARY POPUP LISTENER: This listens for a message sent from the contextMenu listener and toggles a popup held in global named "popupState". Because HTML content injection cannot be done from the background.js script, a message must be sent from the contextMenu action listener in background.js, using the browser.tabs.sendMessage functionality.
*/
let popupState; /// Tried implementing this algorithm keeping this in the local storage; didn't work.

browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  // await browser.storage.local.set({wordListViewState: 'on'});

  if (request.action === "showWordList") {
    popupState = await createSidebar(); 

    document.addEventListener('dblclick', async function(event) {
      if (event.target.matches('.wordListSidebar') || event.target.matches('.wordListSidebar p')) {
        document.removeEventListener('dblclick', this);
        // await browser.storage.local.set({wordListViewState: 'off'});
        popupState.remove();
      }
    });
  }

});


async function createSidebar() {
  let popup = document.createElement('div');
  popup.className = 'wordListSidebar';

  const currentState = await browser.storage.local.get('userWordList');
  const content = currentState.userWordList;
  const dict = Array.from(content);
  
  let entriesToShow = "<p><b>double-click this sidebar to close it</b></p><br>";
  entriesToShow += getWordInfoPrintout(dict); /// this is defined in content.js

  popup.innerHTML = entriesToShow;
  document.body.appendChild(popup);
  return popup;
}


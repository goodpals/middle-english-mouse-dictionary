/* 
  USER DICTIONARY POPUP LISTENER: This listens for a message sent from the contextMenu listener and toggles a popup held in global named "popupState". Because HTML content injection cannot be done from the background.js script, a message must be sent from the contextMenu action listener in background.js, using the browser.tabs.sendMessage functionality.
*/
let sidebarState; /// Tried implementing this algorithm keeping this in the local storage; didn't work.

browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  // await browser.storage.local.set({wordListViewState: 'on'});

  if (request.action === "showWordList") {
    sidebarState = await createSidebar(); 

    document.addEventListener('dblclick', async function(event) {
      if (event.target.matches('.wordListSidebar') || event.target.matches('.wordListSidebar p')) {
        document.removeEventListener('dblclick', this);
        // await browser.storage.local.set({wordListViewState: 'off'});
        sidebarState.remove();
      }
    });
  }

});


async function createSidebar() {
  let sidebar = document.createElement('div');
  sidebar.className = 'wordListSidebar';

  let printout = "<p><b>double-click this sidebar to close it</b></p><br>";
  const keys = Object.keys(activeWords);
  for (k of keys) {
    const word = activeWords[keys[k]];
    const res = dictionaryEntriesToHTMLtext(word);
    printout += res;
  }
  sidebar.innerHTML = printout;
  document.body.appendChild(sidebar);
  return sidebar;
}
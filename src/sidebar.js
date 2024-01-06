/* 
  USER DICTIONARY POPUP LISTENER: This listens for a message sent from the contextMenu listener and toggles a popup held in global named "popupState". Because HTML content injection cannot be done from the background.js script, a message must be sent from the contextMenu action listener in background.js, using the browser.tabs.sendMessage functionality.
*/
let sidebarState; /// Tried implementing this algorithm keeping this in the local storage; didn't work.

browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  // await browser.storage.local.set({wordListViewState: 'on'});

  if (request.action === "showWordList") {
    console.log("showingSidebar1");
    sidebarState = createSidebar(); 
    console.log("showingSidebar2");

    document.addEventListener('dblclick', async function(event) {
      if (event.target.matches('.wordListSidebar') || event.target.matches('.wordListSidebar p')) {
        document.removeEventListener('dblclick', this);
        // await browser.storage.local.set({wordListViewState: 'off'});
        sidebarState.remove();
      }
    });
  }

});

/// TODO: adapt dictionaryEntriesToHTMLtext() to sidebar-specific needs
function createSidebar() {
  const url =  extractBaseURLOfPage();
  const urlExists = userPages.hasOwnProperty(url);
  if (!urlExists) return;
  
  const wordsToShow = userAddedWords.filter((e) => e.url === url);

  let sidebar = document.createElement('div');
  sidebar.className = 'wordListSidebar';

  let printout = "<p><b>double-click this sidebar to close it</b></p><br>";  
  printout += dictionaryEntriesToHTMLtext(wordsToShow);
  sidebar.innerHTML = printout;

  document.body.appendChild(sidebar);
  return sidebar;
}
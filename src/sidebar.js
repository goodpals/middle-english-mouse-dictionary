/* 
  USER WORDLIST SIDEBAR LISTENER: This listens for a message sent from the contex menu listener and toggles a sidebar HTML element held in global scope (see: globals.js). 
  Because HTML content injection cannot be done from the background.js script, a message must be sent from the contextMenu action listener in background.js, using the browser.tabs.sendMessage functionality.
*/

!async function listenForSidebarRequest() {
  browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    const url = extractBaseURLOfPage();
    if (request.action === "showWordList") {
      const currentState = await browser.storage.local.get("sidebarStatesList");
      let sidebarsList = currentState.sidebarStatesList;

      const sidebarPresent = await sidebarExists(url);
      if (sidebarPresent) return; 
      
      sidebarsList[url] = await createSidebar(); 

      await new Promise((resolve) => {
        browser.storage.local.set({ "sidebarStatesList": sidebarsList}, resolve);
      });
    }
  });
}();

async function sidebarExists(url) {
  const currentState = await browser.storage.local.get("sidebarStatesList");
  let sidebarsList = currentState.sidebarStatesList;
  if (sidebarsList[url] == null || sidebarsList[url] == undefined) return false;
  return true;
}

async function removeSidebar() {
  // remove event listener for the Close Button in the sidebar
  const button = document.querySelector(`${delSidebarButtonId}`);

  console.log('removeSidebarLOCALVER: button exists : ' + button);
  
  if (button) {
    button.removeEventListener('click', event => {
      removeSidebar();
    })
  }
  
  const currentState = await browser.storage.local.get("sidebarStatesList");
  let sidebarsList = currentState.sidebarStatesList;
   
  const url = extractBaseURLOfPage();
  const sidebarPresent = await sidebarExists(url);
  if (sidebarPresent) {
    sidebarsList[url].remove();
    delete sidebarsList[url];
  }
  await new Promise((resolve) => {
    browser.storage.local.set({ "sidebarStatesList": sidebarsList}, resolve);
  });
}


async function updateSidebar() {
  const url = extractBaseURLOfPage();
  const currentState = await browser.storage.local.get("sidebarStatesList");
  let sidebarsList = currentState.sidebarStatesList;
  const sidebarPresent = await sidebarExists(url);
  console.log('updateSidebar(): sidebar exists: ' + sidebarPresent);

  if (! sidebarPresent) return;
  console.log('sidebar exists so removing and creating anew')
  removeSidebar();
  sidebarsList[url] = createSidebar(); 

  await new Promise((resolve) => {
    browser.storage.local.set({ "sidebarStatesList": sidebarsList}, resolve);
  });
}

async function createSidebar() {
  const currentState = await browser.storage.local.get(["userWordList", "userPagesList",]);
  const currentPagesList = currentState.userPagesList;

  const url = extractBaseURLOfPage();
  const urlExists = currentPagesList.hasOwnProperty(url);
  if (!urlExists) return;
  
  const pageData = currentPagesList[url];
  const currentWordsList = currentState.userWordList;
  const wordsToShow = currentWordsList.filter((e) => e.url === url).reverse();

  let sidebar = document.createElement('div');
  sidebar.className = 'wordListSidebar';
  sidebar.innerHTML = dictionaryEntriesToHTMLtext(wordsToShow, "sidebar", pageData);
  document.body.appendChild(sidebar);
  
  document.querySelector(`#${delSidebarButtonId}`).addEventListener('click', event => {
    removeSidebar();
  });
  return sidebar;
}



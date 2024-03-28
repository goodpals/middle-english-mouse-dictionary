/* 
  USER WORDLIST SIDEBAR LISTENER: This listens for a message sent from the contex menu listener and toggles a sidebar HTML element held in global scope (see: globals.js). 
  Because HTML content injection cannot be done from the background.js script, a message must be sent from the contextMenu action listener in background.js, using the browser.tabs.sendMessage functionality.
*/

// this is injected into EACH TAB and as such any interaction within a given webpage with this element will only apply to the element in that webpage.
const SIDEBAR_ID = 'memdsidebar'; 


// this waits for the user to open the right-click contextMenu and open the sidebar open button
!async function listenForSidebarRequest() {
  browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    const url = extractBaseURLOfPage();
    if (request.action === "showWordList") {
      if (sidebarExists()) return; 
      await createSidebar(); 
    }
  });
}();


function sidebarExists() {
  const memdSidebar = document.getElementById(SIDEBAR_ID);
  if (!memdSidebar) return false;
  return true;
}


async function removeSidebar() {
  // remove event listener for the Close Button in the sidebar
  // then remove the sidebar itself

  const button = document.querySelector(`${delSidebarButtonId}`);
  if (button) {
    button.removeEventListener('click', async event => {
      await removeSidebar();
    });
  }

  const memdSidebar = document.getElementById(SIDEBAR_ID);
  if (memdSidebar) memdSidebar.remove();
}


async function updateSidebar() {
  const sidebarPresent = sidebarExists();
  if (! sidebarPresent) return;

  await removeSidebar();
  await createSidebar(); 
}


async function createSidebar() {

  const currentState = await browser.storage.local.get(["userWordList", "userPagesList",]);
  const currentPagesList = currentState.userPagesList;

  // Has the user added a word from this page to their list? 
  // If not, then the page's URL won't have been registered in the pagesList
  // ...and therefore there is nothing to show in the sidebar.
  const url = extractBaseURLOfPage();
  const urlExists = currentPagesList.hasOwnProperty(url);
  if (!urlExists) return;
  
  // get words from the current webpage, and present them newest-first.
  const currentWordsList = currentState.userWordList;
  const wordsToShow = currentWordsList.filter((e) => e.url === url).reverse();

  // prepare the sidebar and inject it into the browser DOM
  let sidebar = document.createElement('div');
  sidebar.className = 'wordListSidebar';
  sidebar.id = SIDEBAR_ID;

  const pageData = currentPagesList[url];
  sidebar.innerHTML = dictionaryEntriesToHTMLtext(wordsToShow, "sidebar", pageData);
  
  document.body.appendChild(sidebar);
  
  // you must do this *after* the sidebar element has been injected into the browser
  document.querySelector(`#${delSidebarButtonId}`).addEventListener('click', async event => {
    await removeSidebar();
  });
}



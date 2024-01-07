/* 
  USER DICTIONARY POPUP LISTENER: This listens for a message sent from the contextMenu listener and toggles a popup modal held in global scope (see: globals.js). Because HTML content injection cannot be done from the background.js script, a message must be sent from the contextMenu action listener in background.js, using the browser.tabs.sendMessage functionality.
*/

!async function listenForSidebarRequest () {
  browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    const url = extractBaseURLOfPage();
    if (request.action === "showWordList") {
      console.log(! sidebarExists(url))
      if (! sidebarExists(url)) {
        sidebarStates[url] = createSidebar(); 
      }
      /// TODO: decide on whether we want this functionality or not <----------------------- 

      // document.addEventListener('dblclick', async function(event) {
      //   if (event.target.matches('.wordListSidebar') || event.target.matches('.wordListSidebar p')) {
      //     document.removeEventListener('dblclick', this);
      //     sidebarStates[url].remove();
      //     delete sidebarStates[url];
      //   }
      // });
    }
  });
}();



function removeSidebar() {
  // remove event listener for the Close Button in the sidebar
  const button = document.querySelector(`${delSidebarButtonId}`);
  if (button) {
    button.removeEventListener('click', event => {
      removeSidebar();
    })
  }

  const url = extractBaseURLOfPage();
  if (sidebarExists(url)) {
    sidebarStates[url].remove();
    delete sidebarStates[url];
  }
}


function updateSidebar() {
  const url = extractBaseURLOfPage();
  if (sidebarExists(url)) {
    removeSidebar();
    sidebarStates[url] = createSidebar();
  }
}


function sidebarExists(url) {
  if (sidebarStates[url] == null || sidebarStates[url] == undefined) return false;
  return true;
}


/// TODO: adapt dictionaryEntriesToHTMLtext() to sidebar-specific needs
function createSidebar() {
  const url =  extractBaseURLOfPage();
  if (! userPages.hasOwnProperty(url)) {
    return; // the user must have already added a word from this page. doing so creates a log in userPages global variable.
  }

  const pageData = userPages[url];
  const wordsToShow = userAddedWords.filter((e) => e.url === url).reverse();

  let sidebar = document.createElement('div');
  sidebar.className = 'wordListSidebar';

  sidebar.innerHTML = dictionaryEntriesToHTMLtext(wordsToShow, "sidebar", pageData);

  document.body.appendChild(sidebar);

  // must add query AFTER appended into page body
  document.querySelector(`#${delSidebarButtonId}`).addEventListener('click', event => {
    removeSidebar();
  });
  return sidebar;
}
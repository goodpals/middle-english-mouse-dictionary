/* 
  USER WORDLIST SIDEBAR LISTENER: This listens for a message sent from the contex menu listener and toggles a sidebar HTML element held in global scope (see: globals.js). 
  Because HTML content injection cannot be done from the background.js script, a message must be sent from the contextMenu action listener in background.js, using the browser.tabs.sendMessage functionality.
*/

const SIDEBAR_ID = 'memdsidebar';

// this waits for the user to open the right-click contextMenu and open the sidebar open button
!async function listenForSidebarRequest() {
  browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    const url = extractBaseURLOfPage();
    if (request.action === "showWordList") {
      console.log("listenForSidebarRequest_______start")
      const currentState = await browser.storage.local.get("userPagesList");
      let pagesList = currentState.userPagesList;
      
      const sidebarPresent = await sidebarExists(url);
      console.log("listenForSidebarRequest: sidebarPresent: " + sidebarPresent);
      if (sidebarPresent) {
        // console.log("sidebar already there!")
        // console.log("listenForSidebarRequest_______end");
        return; 
      }
      
      // console.log("listenForSidebarRequest: creating sidebar()");
      console.log("listenForSidebarRequest: creating sidebar()");
      pagesList[url].sideBarOpen = true;
      await new Promise((resolve) => {
        browser.storage.local.set({ "userPagesList": pagesList}, resolve);
      });


      console.log("listenForSidebarRequest: created sidebar; sidebar open? : " + await sidebarExists(url));


      await createSidebar(); 
      
      // console.log("listenForSidebarRequest: created sidebar");
      console.log("listenForSidebarRequest_______end");
    }
  });
}();

async function sidebarExists(url) {
  // console.log("sidebarExists____start");
  const currentState = await browser.storage.local.get("userPagesList");
  const pagesList = currentState.userPagesList;
  console.log("sidebarExists: " + pagesList[url].sideBarOpen);
  // console.log("sidebarExists____end");
  return pagesList[url].sideBarOpen;
}

async function removeSidebar() {
  // remove event listener for the Close Button in the sidebar
  // then remove the sidebar itself
  // then update the sidebar open state of the user pages for the current tab

  console.log("removeSidebar_____begin");
  
  const button = document.querySelector(`${delSidebarButtonId}`);
  // console.log('removeSidebarLOCALVER: button exists : ' + button);
    if (button) {
      button.removeEventListener('click', async event => {
        await removeSidebar();
      });
    }

    const memdSidebar = document.getElementById('memdsidebar');
    if (memdSidebar) {
        memdSidebar.remove();
    }
    
    /// TODO: just look for the id to change the state ffs bro
    const currentState = await browser.storage.local.get("userPagesList");
    let pagesList = currentState.userPagesList;
    const url = extractBaseURLOfPage();
    console.log("checking whether sidebar is present")
    const sidebarPresent = await sidebarExists(url);
    if (sidebarPresent) {
      pagesList[url].sideBarOpen = false;
      console.log("removeSidebar: sidebar updated to: " + pagesList[url].sideBarOpen);
    }

    await new Promise((resolve) => {
      browser.storage.local.set({ "userPagesList": pagesList}, resolve);
    });
    console.log("removeSidebar_____end");
    // console.log(" ")
}


async function updateSidebar() {
  console.log("updateSidebar_______begin")
  
  const url = extractBaseURLOfPage();
  const currentState = await browser.storage.local.get("userPagesList");
  let pagesList = currentState.userPagesList;
  const sidebarPresent = await sidebarExists(url);
  // console.log('updateSidebar(): sidebar exists: ' + sidebarPresent);
  
  if (! sidebarPresent) {
    console.log('sidebar doesnt exist');
    console.log("updateSidebar_______end");
    return;
  }

  console.log('sidebar exists so removing and creating anew')
  await removeSidebar();

  pagesList[url].sideBarOpen = true;
  await new Promise((resolve) => {
    browser.storage.local.set({ "userPagesList": pagesList}, resolve);
  });

  await createSidebar(); 
  
  console.log("updateSidebar_______end")
  console.log("  ")
}


async function createSidebar() {
  // console.log("createSidebar")

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
  sidebar.id = SIDEBAR_ID;
  sidebar.innerHTML = dictionaryEntriesToHTMLtext(wordsToShow, "sidebar", pageData);
  document.body.appendChild(sidebar);
  
  document.querySelector(`#${delSidebarButtonId}`).addEventListener('click', async event => {
    await removeSidebar();
  });
  // console.log("baseURI: " + sidebar.baseURI)
  // console.log("IGNORE EVERYTHIUG ESLE")
  return;
}



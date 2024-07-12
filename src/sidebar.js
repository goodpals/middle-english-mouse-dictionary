/* 
  USER WORDLIST SIDEBAR LISTENER: This listens for a message sent from the contex menu listener (see background.js) and toggles a sidebar HTML element held in global scope (see: globals.js). 
  Because HTML content injection cannot be done from the background.js script, a message must be sent from the contextMenu action listener in background.js, using the browser.tabs.sendMessage functionality.
*/

/**
 * @summary This waits for the user to open the right-click contextMenu and open the sidebar open button
 */
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

  deleteListenersForSidebarButtons();

  const button = document.querySelector(`${SIDEBAR_CLOSE_BUTTON_ID}`);
  if (button) {
    button.removeEventListener('click', async event => {
      await removeSidebar();
    });
  }

  const memdSidebar = document.getElementById(SIDEBAR_ID);
  if (memdSidebar) memdSidebar.remove();
}


function createListenersForSidebarButtons(entries) {
  if (entries == null || entries == undefined) return;
  for (const entry of entries) {
    const id = entry.lookupIndex;
    presentSidebarButtonListeners.push(id);
    document.querySelector(`#${SIDEBAR_REMOVE_WORD_ID_PREFIX}${id}`).addEventListener('click', event => {
      removeWordFromLocalUserList(entry); 
    });
  }
}


function deleteListenersForSidebarButtons() {
  for (const id of presentSidebarButtonListeners) {
    const button = document.querySelector(`#${SIDEBAR_REMOVE_WORD_ID_PREFIX}${id}`);
    if (button) {
      button.removeEventListener('click', event => {
        removeWordFromLocalUserList(entry);
      });
    }
  }
  clearSidebarButtonListeners();
}



//\\\\\\\\\\\\\\\\\\\\\\\\\\\\//
//                            //
//           .---.            //
//     (\./)     \.......-    //
//     >' '<  (__.'""""BP     //
//     " ` " "                //
//                            //
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\//


async function updateSidebar() {
  const sidebarPresent = sidebarExists();
  if (! sidebarPresent) return;

  await removeSidebar();
  await createSidebar(); 
}



async function createSidebar() {
  const context = "createSidebar";
  await addPageToUserPagesList();

  const currentState = await getStateFromStorage(context, ["userWordList", "userPagesList",]);
  const currentPagesList = currentState.userPagesList;
  const currentWordsList = currentState.userWordList;
  if (stateError(`${context}: pagesList`, currentPagesList)) return;
  if (stateError(`${context}: currentWordsList`, currentWordsList)) return;

  const url = extractBaseURLOfPage();
  const urlExists = currentPagesList.hasOwnProperty(url);
  if (!urlExists) return;
  const pageData = currentPagesList[url];
  
  // get stored words from the current webpage, and present them newest-first.
  const wordsToShow = currentWordsList.filter((e) => e.url === url).reverse();

  // prepare the sidebar and inject it into the browser DOM
  let sidebar = document.createElement('div');
  sidebar.className = 'wordListSidebar';
  sidebar.id = SIDEBAR_ID;

  const htmlToPass =  dictionaryEntriesToHTML_sidebar(wordsToShow, pageData);
  sidebar.appendChild(htmlToPass);
  console.log("here")

  document.body.appendChild(sidebar);
  
  // you must do this *after* the sidebar element has been injected into the browser
  document.querySelector(`#${SIDEBAR_CLOSE_BUTTON_ID}`).addEventListener('click', async event => {
    await removeSidebar();
  });

  createListenersForSidebarButtons(wordsToShow);
}




function dictionaryEntriesToHTML_sidebar(entries, pageData) {
  if (entries == null || entries == undefined) return;

  let marginaliaShown = false;
  let textCont = document.createElement('div');

  const btn = document.createElement('button');
  btn.className = 'wordListSidebarButton'; // you have to use a custom class because JS can smd
  btn.title = 'Close Sidebar';
  btn.id = SIDEBAR_CLOSE_BUTTON_ID;
  textCont.appendChild(btn);

  if (pageData != null) {
    const header = document.createElement('p');
    header.className = 'textHeader';
    header.textContent = plaintextToFraktur(pageData.pageName);
    textCont.appendChild(header);
  }

  // account for the user opening the sidebar with an empty word list
  if (entries.length === 0) {
    const message = document.createElement('div');
    message.textContent = `Click the + button in the popup to add words to the sidebar!`;
    textCont.appendChild(message);
    return textCont;
  }

  // build word info content for each word, as an HTML element
  for (const [index, entry] of entries.entries()) {
    const dictEntry = dictionary[entry.lookupIndex];

    const wordHeaderElem = document.createElement('div'); // Use a <div> instead of <p> for flexible layout
    wordHeaderElem.className = "wordData";
    wordHeaderElem.style.whiteSpace = "nowrap"; // Ensure elements stay in a single line if they exceed width
    wordHeaderElem.style.display = "flex"; // Use flexbox for layout
    wordHeaderElem.style.alignItems = "center"; // Center align items vertically

    // make entry word a clickable url
    const urlElem = document.createElement('a');
    urlElem.style.fontWeight = "bold";
    urlElem.textContent = entry.usersSelectedWord;
    urlElem.style.marginRight = "5px";
    urlElem.href = `https://quod.lib.umich.edu/m/middle-english-dictionary/dictionary?utf8=✓&search_field=anywhere&q=${entry.usersSelectedWord}`;
    wordHeaderElem.appendChild(urlElem);

    if (dictEntry.partOfSpeech != null) {
      const speechPartElem = document.createElement('span'); // <span> instead of <p> for inline elements
      speechPartElem.textContent = `${dictEntry.partOfSpeech}`;
      speechPartElem.style.marginRight = "5px";
      speechPartElem.style.display = "inline-block"; // inline-block allows width and height settings
      wordHeaderElem.appendChild(speechPartElem);
    }
    
    // add user word list removal button to each entry
    const removeWordBtn = document.createElement('button');
    const lookupID = entry.lookupIndex;
    removeWordBtn.className = 'removeButton';
    removeWordBtn.id = `${SIDEBAR_REMOVE_WORD_ID_PREFIX}${lookupID}`; 
    removeWordBtn.title = 'Remove word from sidebar'; // Tooltip
    removeWordBtn.style.display = "inline-block"; // Display as inline-block to allow width and height settings
    wordHeaderElem.appendChild(removeWordBtn);
  
    // add variant spellings
    const variantsElem = document.createElement('p');
    variantsElem.className = 'wordData';
    let variantsText = "";
    if (dictEntry.variants != null) {
      variantsText = `Variants: ${dictEntry.variants.join(", ")}`;
    }
    variantsElem.textContent = variantsText;

    const entryElem = document.createElement('p');
    entryElem.className = 'wordData';
    if (dictEntry.entry != null) appendHtmlizedText(entryElem, dictEntry.entry);

    const marginaliaElem = document.createElement('img');
    marginaliaElem.className = "marginalia";
    let src = "";
    if ((entries.length > 2) 
    &&  (index+1 == Math.round(entries.length / 2)  )) {
      if (persistentSideBarMarginaliaURL == null) {
        persistentSideBarMarginaliaURL = browser.runtime.getURL(getRandomImagePath());
      }
      src = persistentSideBarMarginaliaURL;
    }
    marginaliaElem.src = src;

    const dividerElem = document.createElement('p');
    dividerElem.className = "wordData";
    dividerElem.textContent = "_____";
    dividerElem.style.paddingBottom = "10px";

    // combine it all
    textCont.appendChild(wordHeaderElem);
    textCont.appendChild(variantsElem);
    textCont.appendChild(entryElem);
    textCont.appendChild(marginaliaElem);
    textCont.appendChild(dividerElem);
  }

  return textCont;
}

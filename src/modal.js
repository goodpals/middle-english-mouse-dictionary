/* 
  The modal is the little popup that appears near the mouse when the user selects text. 
  See listenForTextSelection() in content.js for how decisions are made about the modal.

  Below is the modal popup (yeFloatingeWindowe), which appears when the user selects text.
    ┌────────┬────────┬────────┬───┐
    │ word 1 │ word 2 │ word 3 │ wo│ <--- These are the tab buttons (_MEMD_TAB_BTN).
    ├────────┴────────┴────────┴───┤
    │                              │
    │  word: (wordtype) [+]  <----------- This [+] button is the add button (_MEMD_ADD_BTN).
    │   info about the word        │
    │   info about the word        │
    │                              │
    │  word: (wordtype) [+]        │
    │   info about the word        │
    │   info about the word        │
    └─────────────────────────────*/



// "DRY" they said, yet making a FrankenFunction for both sidebar and modal is Cursed I say, Cursed!
function dictionaryEntriesToHTML_modal(entries, currentWords) {
  if (entries == null || entries == undefined) return;

  let marginaliaShown = false;
  let textCont = document.createElement('div');

  // set up header

  if (entries.length > 1) {
    const header = document.createElement('p');
    header.className = 'textHeader';
    let headerText = document.createElement('p');
    headerText.textContent = plaintextToFraktur("Possible Matches");
    header.appendChild(headerText);
    textCont.appendChild(header);
  }

  // build word info content for each word, as an HTML element
  for (const [index, entry] of entries.entries()) {
    const dictEntry = dictionary[entry.lookupIndex];

    const wordHeaderElem = document.createElement('div'); // Use a <div> instead of <p> for flexible layout
    wordHeaderElem.className = "wordData";
    wordHeaderElem.style.whiteSpace = "nowrap"; // Ensure elements stay in a single line if they exceed width
    wordHeaderElem.style.display = "flex"; // Use flexbox for layout
    wordHeaderElem.style.alignItems = "center"; // Center align items vertically

    const urlElem = document.createElement('a'); // MAKE ENTRY WORD CLICKABLE URL 
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

    const alreadyInUserList = currentWords.some((e) => e.lookupIndex === entry.lookupIndex && e.url === entry.url);
    
    const addWordBtn = document.createElement('button'); // ADD WORDLIST ADDER BUTTON TO HEADER
    const lookupID = entry.lookupIndex;
    addWordBtn.className = 'addButton';
    if (alreadyInUserList) {
      addWordBtn.classList.add('off');
    }
    addWordBtn.title = 'Add word to sidebar list'; // Tooltip when hovering on button
    addWordBtn.id = `${MODAL_ADDWORD_BUTTON_ID_PREFIX}${lookupID}`;
    addWordBtn.style.display = "inline-block"; // Display as inline-block to allow width and height settings
    wordHeaderElem.appendChild(addWordBtn);


    // New <p> -- add variant spellings
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
    if ((marginaliaShown == false)
    &&  (entries.length > 2) 
    &&  (index+1 == Math.round(entries.length / 2))) {
      const fullURL = browser.runtime.getURL(getRandomImagePath());
      if (fullURL) {
        src = fullURL;
        marginaliaShown = true;
      }
    } 
    
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





/**
 * @param {MouseEvent} event contains co-ordinates for your mouse position etc.
 * @param {Object<string, string>} content a word and its HTMLized dictionary info
 * @param {string} firstWord the first word in the list
 * @param {DOMRect} rect position data for adjusting the popup modal location
 */
async function createModal(event, content, firstWord, rect) {
  const context = "createModal";
  removeListenersForTabButtons();

  let modal = document.createElement('div');
      modal.className = 'wordInfoModalPopup';
      modal.id = MODAL_ID; // see globals.js
      modal.style.left = (rect.x  + window.scrollX - 120) + 'px';
      modal.style.top = (rect.y + window.scrollY + 35) + 'px';

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'wordInfoTabButtonContainer';
  
  buildWordInfoTabSections(content, modal);
  
  // the element must be rendered in order to then get the boundingClientRect & to handle listeners for the tab buttons; without this, the tab sections create won't 'exist' to be activated by the buttons and nothing will show but dead buttons
  // for this reason the tab buttons are created AFTER the tab sections are made above, and as a result, the CSS class wordInfoModalPopup has the setting `column-reverse`
  try {
    modal.appendChild(buttonContainer);
    document.body.appendChild(modal);   
  } catch (error) {
    logError(context, error);
    return;
  }
  await promiseNextFrame();

  createTabButtonsWithListeners(content, modal, buttonContainer);
  showRequestedWordTab(firstWord);
  repositionModal(modal);
}



/*][*][%][*][-][*][%][*][+]
[*]  gJYp Q   .gp.      [*]
[*]  '  $ I.aF" "Tb.    [*]    
[%]    $=I"      $b.    [%]  
[*]    $ I      .$$:    [*]  
[-]    $ IFa..sFYP"     [-]  
[*]    $ I"     "Tb     [*]  
[%]    $ I        Yb    [%]  
[*]    $ I         $!.  [*]  
[*]  .J^RpjF       !P"  [*]  
[+][*][%][*][-][*][%][*][+] epositions the modal. */
function repositionModal(modal) {
  const context = "repositionModal";

  const windowWidth = window.outerWidth; // left to right, starting at zero
  const windowHeight = window.innerHeight + scrollY; // top to bottom, starting at zero + scrolling
  const pos = getModalViewportPosition(modal);
  if (!pos) {
    const error = new Error("Unable to get modal bounding rectangle");
    logError(context, error);
    return;
  }

  // deal with the popup rendering outside the window's boundary
  if (pos.right > windowWidth) {
    const bias = 100;
    const difference = pos.right - windowWidth + bias; // bias is a hacke
    const karlMarx = pos.left - difference; 
    const aynRand = pos.right - difference;
    modal.style.left  = `${karlMarx}px`; // style.side takes a STRINGE
    modal.style.right = `${aynRand}px`; 
  }
  if (pos.left < 0) {
    const bias = 0.75;
    const difference = Math.abs(pos.left); 
    const AOC = pos.left + (difference * bias);
    const theMilkSnatcher = pos.right + (difference * bias);
    modal.style.left  = `${AOC}px`;
    modal.style.right = `${theMilkSnatcher}px`;
  }
  if (pos.bottom > windowHeight) {
    const bias = 50;
    const butBabyIfImTheBottom = pos.bottom - pos.height - bias;
    const youreTheTop = pos.top - pos.height - bias;
    modal.style.bottom = `${butBabyIfImTheBottom}px`;
    modal.style.top = `${youreTheTop}px`;
  }
}


function getModalViewportPosition(modal) {
  const modalRect = modal.getBoundingClientRect();
  return {
      top: modalRect.top + window.scrollY,
      left: modalRect.left + window.scrollX,
      bottom: modalRect.bottom + window.scrollY,
      right: modalRect.right + window.scrollX,
      height: modalRect.height
  };
}



/**
 * @param {Object<string, string>} content a word and its HTMLized dictionary info
*/
function createTabButtonsWithListeners(content, modal, buttonContainer) {
  const context = "createTabButtonsWithListeners";
  // const buttons = modal.querySelectorAll('.wordInfoTabButton');

  Object.keys(content).forEach((key) => {
    let button = document.createElement('button');
    const targetId = `${MODAL_WORDTAB_CONTENT_PREFIX}${key}`; // must be const'd

    button.id = `${MODAL_WORDTAB_BUTTON_PREFIX}${key}`;
    button.className = 'wordInfoTabButton';
    button.textContent = key;
    button.addEventListener('click', (event) => showRequestedWordTab(key));

    try {
      buttonContainer.appendChild(button);
    } catch (error) {
      logError(context, error);
      return;
    }
  });
}


function showRequestedWordTab(targetId) {
  const targetElement = document.getElementById(`${MODAL_WORDTAB_CONTENT_PREFIX}${targetId}`);
  const otherElements = document.querySelectorAll('.wordInfoTab');
  otherElements.forEach(element => element.style.display = "none");
  targetElement.style.display = "block";
  const buttons = document.querySelectorAll('.wordInfoTabButton');
  buttons.forEach(button => button.className = 'wordInfoTabButton');
  const button = document.getElementById(`${MODAL_WORDTAB_BUTTON_PREFIX}${targetId}`);
  button.className = 'wordInfoTabButton active';
}


function removeListenersForTabButtons() {
  for (const id of presentTabButtonListeners) {
    const button = document.querySelector(`#${MODAL_WORDTAB_BUTTON_PREFIX}${id}`); // note the hash
    if (button) button.removeEventListener('click', (event) => showRequestedWordTab(targetId));
  }
  clearTabButtonListeners();
}



/**
 * @param {Object<string, string>} content a word and its HTMLized dictionary info
 * @param {*} modal the modal to which such HTML text will be applied
 */
async function buildWordInfoTabSections(content, modal) {
  const context = "buildWordInfoTabSections";
  Object.entries(content).forEach(([key, HTMLElement]) => {
    let elem = document.createElement('div');
    const id = `${MODAL_WORDTAB_CONTENT_PREFIX}${key}`;
    presentTabButtonListeners.push(`${MODAL_WORDTAB_BUTTON_PREFIX}${key}`);

    elem.id = id;
    elem.className = 'wordInfoTab';
    elem.appendChild(HTMLElement);

    try {
      modal.appendChild(elem);
    } catch (error) {
      logError(context, error);
      return;
    }
  });
}



//\\\\\\\\\\\\\\\\\\\//
//                   //
//    |\/| ---- _    //
//   =(--)=_____ \   // 
//   c___ (______/   //
//                   //
//\\\\\\\\\\\\\\\\\\\//



/**
 * @param {Array<MatchedWordEntry>} entries 
 */
function createListenersForModalButtons(entries) {
  if (entries == null || entries == undefined) return;
  for (const entry of entries) {
    const id = entry.lookupIndex;
    presentModalButtonListeners.push(id);
    const elemId = `#${MODAL_ADDWORD_BUTTON_ID_PREFIX}${id}`;
    document.querySelector(elemId).addEventListener('click', event => {
      addWordToUserList(entry); 
    });
  }
}



function deleteListenersForModalButtons() {
  for (const id of presentModalButtonListeners) {
    const button = document.querySelector(`#${MODAL_ADDWORD_BUTTON_ID_PREFIX}${id}`);
    if (button) {
      button.removeEventListener('click', event => {
        addWordToUserList(entry);
      });
    }
  }
  clearModalButtonListeners();
}



/**
 * @param {MouseEvent} event 
 * @param {string} content 
 * @param {string} firstWord the first word in the list
 * @param {DOMRect} rect position data for adjusting the popup modal location
 */
function createOrUpdateModal(event, content, firstWord, rect) {
  let modal = findModal();
  if (modal == null || modal == undefined) {
    createModal(event, content, firstWord, rect);
  } else {
    modal.remove();
    createModal(event, content, firstWord, rect);
  }
}


function hideModal() {
  const modal = findModal();

  if (modal != null) {
    modal.remove();
  }
}


/**
 * @returns {HTMLElement | null}
 */
function findModal() {
  return document.getElementById(MODAL_ID);
}








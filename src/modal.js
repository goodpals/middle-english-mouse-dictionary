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
    const difference = pos.right - windowWidth - bias; // -100 is a hacke
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
function buildWordInfoTabSections(content, modal) {
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



function createListenersForModalButtons(entries) {
  if (entries == null || entries == undefined) return;
  for (const entry of entries) {
    const id = entry.lookupIndex;
    presentListeners.push(id);
    document.querySelector(`#${MODAL_ADDWORD_BUTTON_ID_PREFIX}${id}`).addEventListener('click', event => {
      addWordToLocalUserList(entry); 
    });
  }
}


function deleteListenersForModalButtons() {
  for (const id of presentListeners) {
    const button = document.querySelector(`#${MODAL_ADDWORD_BUTTON_ID_PREFIX}${id}`);
    if (button) {
      button.removeEventListener('click', event => {
        addWordToLocalUserList(entry);
      });
    }
  }
  clearPresentListeners();
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


function promiseNextFrame(){
  return new Promise(resolve => requestAnimationFrame(resolve)); 
}





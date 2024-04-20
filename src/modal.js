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
 * @param {Object<string, string} content a word and its HTMLized dictionary info
 * @param {DOMRect} rect position data for adjusting the popup modal location
 */
async function createModal(event, content, rect) {

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
  modal.appendChild(buttonContainer);
  document.body.appendChild(modal); 
  await promiseNextFrame();

  createTabButtonsWithListeners(content, modal, buttonContainer);
  showRequestedWordTab(presentTabButtonListeners[0]);
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
  const windowWidth = window.outerWidth;
  const modalCoordinates = modal.getBoundingClientRect();
  const modal_rightEdge = modalCoordinates.right;
  const modal_leftEdge = modalCoordinates.left; 

  // deal with the popup rendering outside the window's boundary
  if (modal_rightEdge > windowWidth) {
    const difference = modal_rightEdge - windowWidth;
    const karlMarx = modal_leftEdge - difference - 100; // -100 is a hacke
    const aynRand = modal_rightEdge - difference - 100;
    modal.style.left  = `${karlMarx}px`; // style.left takes a STRINGE
    modal.style.right = `${aynRand}px`; 
  }
}



/**
 * @param {Object<string, string} content a word and its HTMLized dictionary info
*/
function createTabButtonsWithListeners(content, modal, buttonContainer) {
  const buttons = modal.querySelectorAll('.wordInfoTabButton');

  Object.keys(content).forEach((key) => {
    let button = document.createElement('button');
    const targetId = `${MODAL_WORDTAB_ID_PREFIX}${key}`; // must be const'd

    button.id = targetId;
    button.className = 'wordInfoTabButton';
    button.textContent = key;
    button.addEventListener('click', (event) => showRequestedWordTab(targetId));

    buttonContainer.appendChild(button);
  });
}


function showRequestedWordTab(targetId) {
  const targetElement = document.getElementById(targetId);
  const otherElements = document.querySelectorAll('.wordInfoTab');
  otherElements.forEach(element => element.style.display = "none");
  targetElement.style.display = "block";
}


function removeListenersForTabButtons() {
  for (const id of presentTabButtonListeners) {
    const button = document.querySelector(`#${MODAL_WORDTAB_ID_PREFIX}${id}`); // note the hash
    if (button) button.removeEventListener('click', (event) => showRequestedWordTab(targetId));
  }
  clearTabButtonListeners();
}



/**
 * @param {Object<string, string} content a word and its HTMLized dictionary info
 * @param {*} modal the modal to which such HTML text will be applied
 */
function buildWordInfoTabSections(content, modal) {
  Object.entries(content).forEach(([key, HTMLText]) => {
    let elem = document.createElement('div');
    const id = `${MODAL_WORDTAB_ID_PREFIX}${key}`;
    presentTabButtonListeners.push(id);

    elem.id = id;
    elem.className = 'wordInfoTab';
    elem.innerHTML = HTMLText;
    
    modal.appendChild(elem);
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
 */
function createOrUpdateModal(event, content, rect) {
  let modal = findModal();
  if (modal == null || modal == undefined) {
    createModal(event, content, rect);
  } else {
    modal.remove();
    createModal(event, content, rect);
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





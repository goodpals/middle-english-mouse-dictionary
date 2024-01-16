/* 
  The modal is the little popup that appears near the mouse when the user selects text. 
  See listenForTextSelection() in content.js for how decisions are made about the modal.
*/


/**
 * @param {MouseEvent} event contains co-ordinates for your mouse position etc.
 * @param {Object<string, string} content a word and its HTMLized dictionary info
 * @param {DOMRect} rect position data for adjusting the popup modal location
 */
async function createModal(event, content, rect) {

  removeListenersForTabButtons();

  let modal = document.createElement('div');
      modal.className = 'wordInfoModalPopup';
      modal.id = modalId; // see globals.js
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
    const targetId = `_W${key}`; // must be const'd
    button.id = targetId;
    button.className = 'wordInfoTabButton';
    button.textContent = key;
    button.addEventListener('click', (event) => showRequestedWordTab(targetId));
    // modal.appendChild(button);
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
    const button = document.querySelector(`#_W${id}`);
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
    const id = `_W${key}`;
    presentTabButtonListeners.push(id);

    elem.id = id;
    elem.className = 'wordInfoTab';
    elem.innerHTML = HTMLText;
    
    modal.appendChild(elem);
  });
}



function createListenersForModalButtons(entries) {
  if (entries == null || entries == undefined) return;
  for (const entry of entries) {
    const id = entry.lookupIndex;
    presentListeners.push(id);
    document.querySelector(`#_${id}`).addEventListener('click', event => {
      // console.log("querySelector anonyFuncty: " + entryConst.lookupIndex);
      addWordToUserList(entry);
    });
  }
  // console.log("createListenersForButtons : present listeners: " + presentListeners);
}


function deleteListenersForModalButtons() {
  for (const id of presentListeners) {
    const button = document.querySelector(`#_${id}`);
    if (button) {
      button.removeEventListener('click', event => {
        addWordToUserList(entry);
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
    // TODO: FIX so removal and recreation unnecessary
    // modal.innerHTML = content; // before
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
  return document.getElementById(modalId);
}


function promiseNextFrame(){
  return new Promise(resolve => requestAnimationFrame(resolve)); 
}



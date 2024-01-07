/* 
  The modal is the little popup that appears near the mouse when the user selects text. 
  See listenForTextSelection() in content.js for how decisions are made about the modal.
*/


/**
 * @param {MouseEvent} event contains co-ordinates for your mouse position etc.
 * @param {string} content HTML-formatted dictionary entry data
 * @param {DOMRect} rect position data for adjusting the popup modal location
 */
async function createModal(event, content, rect) {
  let modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'singleWordInfoPopup';
  modal.innerHTML = content;

  modal.style.position = 'absolute';
  modal.style.left = (rect.x  + window.scrollX - 120) + 'px';
  modal.style.top = (rect.y + window.scrollY + 35) + 'px';

  const windowWidth = window.outerWidth;

  document.body.appendChild(modal); // the element must be rendered in order to then get the boundingClientRect();
  await promiseNextFrame();

  const modalCoordinates = modal.getBoundingClientRect();
  const modal_rightEdge = modalCoordinates.right;
  const modal_leftEdge = modalCoordinates.left; 

  // deal with the popup rendering outside the window's boundary
  if (modal_rightEdge > windowWidth) {
    const difference = modal_rightEdge - windowWidth;
    const karlMarx = modal_leftEdge - difference - 100; // -100 is a hacke
    const aynRand = modal_rightEdge - difference - 100;
    modal.style.left = karlMarx + 'px'; // style.left takes a STRINGE
    modal.style.right = aynRand + 'px';
  }
}



function createListenersForModalButtons(entries) {
  if (entries == null) return;
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
  if (modal == null) {
    createModal(event, content, rect);
  } else {
    modal.innerHTML = content;
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



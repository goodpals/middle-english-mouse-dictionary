const ERROR_MODAL_BUTTON_ID = "MEMD_ERR_MODAL_BTN";
const ERROR_MODAL_ID = "MEMD_ERR_MODAL";
let ERR_MODAL_ACTIVE = false;


function logError(context, error) {
  console.error("MEMD: " + context + ": " + error);
  if (ERR_MODAL_ACTIVE == false) createErrorModal(context, error);
}
  

async function createErrorModal(message, context, error) {

  let modal = document.createElement('div');
      modal.className = 'errorModal';
      modal.id = ERROR_MODAL_ID;
  
  let fullURL = browser.runtime.getURL(getSpecificImagePath("deathD"));
  const errorMessage = `
    <button id="${ERROR_MODAL_BUTTON_ID}" class="errorButton">✕</button><br>
    <img src="${fullURL}" style="width:27.5%; float: left; margin-right:2.5%" alt="D"> 

    <p><b> earest apologies; there's a bug in our code! <br><br>
    We're really sorry for the hassle. The most recent error was: <br>
    <pre>${context} : ${error}. </pre>
    If you don't mind, please consider submitting an Issue to our software repository, and we will try to fix it. <br><br>

    To submit an issue, open your console by pressing CTRL+SHIFT+I (or on Mac, ⌘ + ⌥ + I), copy the 'MEMD' error messages that appear with a quick description or screenshots of what you were doing when this message popped up, and <a href="https://github.com/goodpals/middle-english-mouse-dictionary/issues/new/choose" target="_blank">open a new Issue on Github</a>. <br><br>
    Click the <b>x</b> button in the top right to hide this popup.</b></p>
  `;

  modal.innerHTML = errorMessage;
  document.body.appendChild(modal); 
  await promiseNextFrame();

  document.querySelector(`#${ERROR_MODAL_BUTTON_ID}`).addEventListener('click', async event => {
    await removeErrorModal();
  });

  ERR_MODAL_ACTIVE = true;
}



async function removeErrorModal() {
  // remove event listener for the Close Button in the sidebar
  // then remove the sidebar itself
  const button = document.querySelector(`${ERROR_MODAL_BUTTON_ID}`);
  if (button) {
    button.removeEventListener('click', async event => {
      await removeErrorModal();
    });
  }
  
  const errModal = document.getElementById(ERROR_MODAL_ID);
  if (errModal) errModal.remove();

  ERR_MODAL_ACTIVE = false;
}

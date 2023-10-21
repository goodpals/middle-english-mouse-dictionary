/* The content.js file is responsible for injecting or modifying the content of web pages that you visit */


/* 
  WORD LOOKUP LISTENER: this listens for the user double-clicking a word in the DOM and checks the dictionary for that word, making an info popup & adding it to the user's dictionary. The popup then closes on a single click anywhere in the DOM.
*/
document.addEventListener('dblclick', async function(event) 
{
  /// Check whether the extension is "soft disabled" i.e. when you leftclick the extension toolbar button it 
  /// doesn't get disabled, but it is "shut down" so that users can decide when they want to use it or not.
  const currentState = await browser.storage.local.get();
  // debugState(appOnOffState);
  if (currentState.onOffState != 'on') {
    return;
  }

  /// the user is clicking on whitespace, or maybe punctuation? Do not show. Fuck the word 'a' in particular.
  const selectedText = window.getSelection().toString();
  if (selectedText == null || selectedText.length == 1 || selectedText.length == 0) {
    return;
  }

  const selectedWordInfo = searchDictionary(selectedText);
  if (selectedWordInfo == null) {
    return; /// User word is not in the dictionary!
  }

  // All checks passed: style, position, and then show a word info popup
  const info  = "ME word: " + selectedWordInfo.word + "\n"
            + "Type: " + selectedWordInfo.type + "\n"
            + "Origin: " + selectedWordInfo.origin + "\n";
          
  createPopup(event, info);
  addToUserDictionary(selectedWordInfo, currentState);
  // createOtherPopup();
});



/* 
  Helper functions begin
*/
async function addToUserDictionary(selectedWordInfo, currentState) {
  let content = Array.from(currentState.userDictionary);

  if (content.some(entry => entry.word === selectedWordInfo.word)) {
    return; /// selected word is already in dict
  }
  content.push(selectedWordInfo);
  await browser.storage.local.set({userDictionary: content});
  console.log(content)
}


function searchDictionary(selectedWord) {
  if (selectedWord in dictionary) {
    return dictionary[selectedWord];
  } else {
    return null;
  }
}


function createPopup(event, info) {
  let popup = document.createElement('div');
  popup.className = 'singleWordInfoPopup';
  popup.innerText = info;

  /// TODO: when near the browser window edge this can create an element that partially appears outside of the DOM and 
  popup.style.position = 'absolute';
  popup.style.left = (event.clientX + window.scrollX - 100) + 'px';
  popup.style.top = (event.clientY + window.scrollY + 15) + 'px';

  document.body.appendChild(popup);

  document.addEventListener('click', function(event) {
    document.removeEventListener('click', this);
    popup.remove();
  });
}


async function debugState(currentState) {
  console.log('App on/off state: ' + currentState.onOffState);
  let inverseState = currentState.onOffState == 'on' ? 'off' : 'on';
  console.log('inverse value of state: ' + inverseState);
  await browser.storage.local.set({ onOffState: inverseState });
  const result = await browser.storage.local.get('onOffState');
  console.log('App on/off state after setting to inverse value: ' + result.onOffState);

  const check = await browser.storage.local.get('sidebar');
  console.log("Current sidebar state: " + check.sidebar);
  
  console.log('_____');
}
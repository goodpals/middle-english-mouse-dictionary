/* The content.js file is responsible for injecting or modifying the content of web pages that you visit */


/* 
  This is the monitor for user lookup requests (i.e. double-clicking a word): it looks out for the user doing so and checks the dictionary for that word, making an info popup in the DOM. It then closes on a single click anywhere in the DOM.
*/
document.addEventListener('dblclick', async function(event) 
{
  /// Check whether the extension is "soft disabled" i.e. when you leftclick the extension toolbar button it 
  /// doesn't get disabled, but it is "shut down" so that users can decide when they want to use it or not.
  const currentState = await browser.storage.local.get('onOffState');
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
  addToDictionary(selectedWordInfo);
});


/* 
  Helper functions begin
*/
async function addToDictionary(selectedWordInfo) {
  const currentState = await browser.storage.local.get('dictionaryContent');
  let content = Array.from(currentState.dictionaryContent);

  if (content.some(entry => entry.word === selectedWordInfo.word)) {
    return; /// selected word is already in dict
  }

  content.push(selectedWordInfo);
  await browser.storage.local.set({dictionaryContent: content});
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

  popup.style.position = 'absolute';
  popup.style.left = (event.clientX + window.scrollX - 100) + 'px';
  popup.style.top = (event.clientY + window.scrollY + 15) + 'px';

  document.body.appendChild(popup);

  document.addEventListener('click', function(event) {
    document.removeEventListener('click', this);
    popup.remove();
  });

  // setTimeout(function() { popup.remove(); }, 3000); /// alt option but don't like it
}


/// test with e.g.: https://dictionary.cambridge.org/dictionary/english/season
const dictionary = {
  "season": {
    "word": "Sesoun", 
    "type": "n.",
    "meaning": "season, time", 
    "origin": "OFr. se(i)son.",
  },
  "down": {
    "word": "Adoun, Adown", 
    "type": "adv.",
    "meaning": "down", 
    "origin": "OE. of-dūne, adūne.",
  },
  "the": {
    "word": "þe", 
    "type": "determiner",
    "meaning": "bro þe is the", 
    "origin": "TH. theeee, thhhbthbthbtb",
  },
  "items": {
    "word": "items", 
    "type": "itemmussuins",
    "meaning": "itemaniacs", 
    "origin": "itemland",
  },
  "seats": {
    "word": "seats", 
    "type": "seattt",
    "meaning": "sit doun pls", 
    "origin": "SEATLAMND",
  },
  "has": {
    "word": "has", 
    "type": "hasss",
    "meaning": "bro has is has", 
    "origin": "THEN HAVES AN D TEH HAVE KNOWRTS b",
  },
};


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
/// The content.js file is responsible for injecting or modifying the content of web pages that you visit

/// This is the monitor for user lookup requests (i.e. double-clicking a word): it looks out for the user doing so and checks the dictionary for that word, making an info popup in the DOM. It then closes on a single click anywhere in the DOM.
document.addEventListener('dblclick', function(event) {

  /// Check whether the extension is "soft disabled" i.e. when you leftclick the extension toolbar button it 
  /// doesn't get disabled, but it is "shut down" so that users can decide when they want to use it or not.
  chrome.storage.local.get('state', (result) => {
    /// PROBLEM: see background.js for why this isn't working right. 
    /// PROBLEM: even if state is 'off', it doesn't return.
    console.log('App state: ' + result.state);
    if (result.state != 'on') {
      return;
    }
  });

  const selectedText = window.getSelection().toString();
  if (selectedText == null || selectedText.length == 1 || selectedText.length == 0) {
    /// the user is clicking on whitespace, or maybe punctuation. Do not show.
    return;
  }

  let selectedWordInfo = searchDictionary(selectedText);
  if (selectedWordInfo == null) {
    return;
  }

  // All checks passed: style, position, and then show a word info popup
  const info  = "ME word: " + selectedWordInfo.word + "\n"
            + "Type: " + selectedWordInfo.type + "\n"
            + "Origin: " + selectedWordInfo.origin + "\n";

  let popup = document.createElement('div');
  popup.className = 'infoPopup';
  popup.innerText = info;

  popup.style.position = 'absolute';
  popup.style.left = (event.clientX + window.scrollX - 20) + 'px';
  popup.style.top = (event.clientY + window.scrollY + 10) + 'px';

  document.body.appendChild(popup);

  document.addEventListener('click', function(event) {
    document.removeEventListener('click', this);
    popup.remove();
  });

  // setTimeout(function() { popup.remove(); }, 3000); /// alt option but don't like it
});


function searchDictionary(selectedWord) {
  if (selectedWord in dictionary) {
    return dictionary[selectedWord];
  } else {
    return null;
  }
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
};
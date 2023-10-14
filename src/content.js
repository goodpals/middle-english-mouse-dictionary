/// The content.js file is responsible for injecting or modifying the content of web pages that you visit

// !function name(){} (); auto-runs the code as soon as it is loaded in to the DOM.
!function injectStylesheet() {

  // This is cursed but I can't find a non-framework, non bullshit way to parse the CSS file into it that doesn't involve hosting or gymnastics.
  // Ideally we just "var style... style.textcontent = readFromCSS(./infoPopup.css;" but it's not that simple lmao
  let style = document.createElement('style');
  style.textContent = `
    .infoPopup {
      background-color: #dddddd;
      color: black;
      border: 1px solid #ccc;
      padding: 10px;
      font-family: 'Times New Roman', Times, serif;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
      font-size: 14px;
    }  
  `;
  document.head.appendChild(style);
}();


/// This is the monitor for user lookup requests (i.e. double-clicking a word): it looks out for the user doing so and checks the dictionary for that word, making an info popup in the DOM. It then closes on a single click anywhere in the DOM.
document.addEventListener('dblclick', function(event) {
  
  const selectedText = window.getSelection().toString();
  if (selectedText == null || selectedText.length == 1 || selectedText.length == 0) {
    /// the user is clicking on whitespace, or maybe punctuation. Do not show.
    return;
  }
  let selectedWordInfo = searchDictionary(selectedText);
  if (selectedWordInfo == null) {
    return;
  }

  const info  = "ME word: " + selectedWordInfo.word + "\n"
            + "Type: " + selectedWordInfo.type + "\n"
            + "Origin: " + selectedWordInfo.origin + "\n";

  // Style, position, and then show a word info popup
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
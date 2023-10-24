/* The content.js file is responsible for injecting or modifying the content of web pages that you visit */


/* 
  WORD LOOKUP LISTENER: this listens for the user double-clicking a word in the DOM and checks the dictionary for that word, making an info popup & adding it to the user's dictionary. The popup then closes on a single click anywhere in the DOM.
*/
document.addEventListener('dblclick', async function(event) 
{
  /// Check whether the extension is "soft disabled" i.e. when you leftclick the extension toolbar button it doesn't get disabled, but it is "shut down" so that users can decide when they want to use it or not.
  const currentState = await browser.storage.local.get();
  // debugState(appOnOffState);
  if (currentState.onOffState != 'on') {
    return;
  }

  /// the user is clicking on whitespace, or maybe punctuation? Do not show. Fuck the word 'a' in particular.
  const selectedText = window.getSelection().toString().toLowerCase(); /// TODO: to lowercase && checks
  if (selectedText == null || selectedText.length == 1 || selectedText.length == 0) {
    return;
  }

  /// Extract word info for every plausible word the selectedText might be, and add selectedText as a 'word' key:val to each
  const selectedWordInfo = searchDictionary(selectedText); 
  if (selectedWordInfo == null || selectedWordInfo == undefined) {
    return; /// User word is not in the dictionary!
  }
  
  // All checks passed: style, position, and then show a word info popup
  const printout = getWordInfoPrintout(selectedWordInfo);
  createPopup(event, printout);
  
  await addToUserWordList(selectedWordInfo, currentState);
});


/* 
  Helper functions begin
*/
/// TODO: this function has a problem. 
/// See: https://youtu.be/eAj1Og4atM0
/// See: my rage at Javascript and also myself
async function addToUserWordList(thisWordInfo, state) {
  const content = state.userWordList;
  let userWords = Array.from(content);

  console.log(userWords)
  console.log("____")

  const hasCommonWord = userWords.some(userWordsEntry => {
    return thisWordInfo.some(selectedEntry => {
      return userWordsEntry.word === selectedEntry.word;
    });
  });
  if (hasCommonWord == true) {
    console.log('has Common word, not adding to list')
    return; /// selected word is already in dict
  }
  console.log('no Common word, adding to list')

  for (entry of thisWordInfo) {
    userWords.push(entry);
  }
  await browser.storage.local.set({userWordList: userWords});
  /// Now, when the user opens the UWL side panel from their right-click contextMenu, the updated list will display.
}






function searchDictionary(selectedWord) {
  /* Say the user double-clicks the word "þen" in their browser. þen appears in the lookup table as the key to the key:value pair  "þen": ["4185", "4186", "4209"]. Each number is an entry index, and so there are multiple entries that might be the correct "þen" that our user wants to know about. We need to build a list of objects containing each entry. In the dictionary itself, 4185 for example is:   
    "4185": { "variants": ["þen", "þene", "þenn", "þenne"], "partOfSpeech": null, "entry": "#Þen(e)#, V 131, 191, 227, &c.; #Þenn(e)#, V 78, 92, 268, 321, &c.; _orthan_, or else, X 51. [OE. _þonne_, _þanne_, _þænne_.]" }, 
  */
  if (selectedWord in dictionaryLookupTable) {
    const wordIndex = dictionaryLookupTable[selectedWord];
    // console.log(wordIndex)
    
    /* TODO: 
    actually you probably want a user word list entry object which is
      String id, String variant, String word
    where variant is the matched variant and word is the word they actually tapped (which might not be the same cos of fuzzy), the id in dict.json */
    
    let wordInfoList = [];
    for (index of wordIndex) {
      let entry = { 
        word: selectedWord,
        ...dictionary[index] /* this is sugar; it just adds the rest of the indexed object to entry */
      };
      wordInfoList.push(entry);
    }
    return wordInfoList;
  } else {
    return null;
  }
}


function getWordInfoPrintout(info) {
  // console.log(info)
  let text = "";
  if (info.length > 1) {
    text += "<h4>Possible Matches:</h4>";
  }
  for (entry of info) {
    if (entry.word != null){
      text += "<p><b>" + entry.word + "</b>";
      if (entry.partOfSpeech != null){
        text += ": " + entry.partOfSpeech;
      }
      text += "</p>";
    }

    if (entry.variants != null){
      text += "<p>Variants: " + entry.variants.join(", ") + "</p>";
    }
    if (entry.entry != null){
      let htmlizedEntry = htmlize(entry.entry);
      text += "<p>" + htmlizedEntry + "</p>";
    }
    text += "<p>_____</p>";
  }

  return text;
}


function htmlize(entry) {
  const boldRegex = /#([^#]+)#/g;
  const italicRegex = /_([^_]+)_/g;

  const replacedHashtags = entry.replace(boldRegex, (match, p1) => `<b>${p1}</b>`);
  const replacedUnderscores = replacedHashtags.replace(italicRegex, (match, p1) => `<i>${p1}</i>`);

  return replacedUnderscores;
}


function createPopup(event, info) {
  let popup = document.createElement('div');
  popup.className = 'singleWordInfoPopup';
  popup.innerHTML = info;

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
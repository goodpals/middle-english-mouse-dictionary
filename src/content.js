/* The content.js file is responsible for injecting or modifying the content of web pages that you visit */

/* 
  WORD LOOKUP LISTENER: this listens for the user double-clicking a word in the DOM and checks the dictionary for that word, making an info popup & adding it to the user's dictionary. The popup then closes on a single click anywhere in the DOM.
*/
document.addEventListener('dblclick', async function(event) 
{
  const currentState = await browser.storage.local.get();
  if (currentState.onOffState != 'on') {
    return;
  }

  const selectedText = window.getSelection().toString().toLowerCase();
  if (selectedText == null || selectedText.length == 1 || selectedText.length == 0) {
    /// the user is clicking on whitespace, or maybe punctuation? Do not show. Fuck the word 'a' in particular.
    return;
  }

  if (currentState.dictionaryChoice == 'MED') {
    browser.runtime.sendMessage({word: selectedText});
    return; // must return else popup will still appear
  }

  const selectedWordInfo = searchDictionary(selectedText); 
  if (selectedWordInfo == null || selectedWordInfo == undefined) {
    return; // User word is not in the dictionary
  }
  
  // All checks passed: style, position, and then show a word info popup
  const printout = getWordInfoPrintout(selectedWordInfo);
  createPopup(event, printout);
  
  await addToUserWordList(selectedWordInfo, currentState);
});



class userWordListEntry {
  constructor(lookupIndex, matchedVariant, usersSelectedWord) {
    this.lookupIndex = lookupIndex; // a single key to an object in dict.json
    this.matchedVariant = matchedVariant; // the specific matched variant in lookup.json
    this.usersSelectedWord = usersSelectedWord; // the word the user actually tapped (which might not be the same due to fuzzy matching)
  }
}


/* 
  Helper functions begin
*/

/// TODO: ALEX: this bug doesn't happen every time. 
/// First, open this link: https://quod.lib.umich.edu/c/cme/Gawain?rgn=main;view=fulltext
/// Then, click a few words, and see the popups should work fine. Note in the console that userWords' FIRST console.log outputs information it should only have by the time the 2nd console log around line 70 is called.
/// Now for the dictionary building problem. This is inconsistent. Look at the 3rd line of "Passus I". Doubleclick "þer" and then do "wroȝt" right next to it. Then right-click anywhere and select "show dictionary". It'll be empty. 
async function addToUserWordList(thisWordInfo, state) {
  const content = state.userWordList;
  let userWords = Array.from(content);
  
  console.log(userWords) /// this log should not contain any information about the word that has just been clicked.
  
  const hasCommonIndex = userWords.some(userWordsEntry => {
    return thisWordInfo.some(selectedEntry => {
      return userWordsEntry.lookupIndex === selectedEntry.lookupIndex;
    });
  });
  if (hasCommonIndex == true) {
    console.log(hasCommonIndex + ': true : has Common word, not adding to list')
    return; /// selected word is already in dict
  }
  console.log(hasCommonIndex + ': false : no Common word, adding to list')
  
  for (entry of thisWordInfo) {
    userWords.push(entry);
  }
  console.log(userWords);
  console.log("____")
  await browser.storage.local.set({userWordList: userWords});
  /// Now, when the user opens the UWL side panel from their right-click contextMenu, the updated list will display.
}


function searchDictionary(selectedWord) {
  /// Check if the passed-in word matches a key in lookup.json. 
  /// The value to this lookup will be an index for an entry in dict.json.
  if (selectedWord in dictionaryLookupTable) {
    const wordIndexes = dictionaryLookupTable[selectedWord];
    // console.log(wordIndex)

    let extractedEntries = []; 
    for (index of wordIndexes) {
      /// TODO: change "matchedVariant" to whatever selectedWord is fuzzymatched to once fuzzymatching is implemented
      const entry = new userWordListEntry(index, selectedWord, selectedWord); 
      extractedEntries.push(entry);
    }

    return extractedEntries;
  } else {
    return null;
  }
}


/// This function receives a list of userWordListEntry class objects and uses their index value to get info from the dictionary, and returns it as formatted text. 
function getWordInfoPrintout(info) {
  // console.log(info)
  let text = "";
  if (info.length > 1) {
    text += "<h4>Possible Matches:</h4>";
  }

  for (entry of info) {
    const dictEntry = dictionary[entry.lookupIndex]; /// 
    
    text += "<p><b>" + entry.usersSelectedWord + "</b>";
    
    if (dictEntry.partOfSpeech != null) {
      text += ": " + dictEntry.partOfSpeech;
    }
    text += "</p>";

    if (dictEntry.variants != null) {
      text += "<p>Variants: " + dictEntry.variants.join(", ") + "</p>";
    }
    if (dictEntry.entry != null) {
      const entryText = dictEntry.entry;
      const htmlizedEntry = htmlize(entryText);
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

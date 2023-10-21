/* 
  USER DICTIONARY POPUP LISTENER: This listens for a message sent from the contextMenu listener and toggles a popup held in global named "popupState". Because HTML content injection cannot be done from the background.js script, a message must be sent from the contextMenu action listener in background.js, using the browser.tabs.sendMessage functionality.
*/
let popupState = null;

browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  // await browser.storage.local.set({dictionaryViewState: 'on'});

  if (request.action === "showTheDictionary") {
    popupState = await createDictionaryPopup(); 
    console.log("opened");

    document.addEventListener('dblclick', async function(event) {
      if (event.target.matches('.dictionaryPopup') || event.target.matches('.dictionaryPopup p')) {
        document.removeEventListener('dblclick', this);
        // await browser.storage.local.set({dictionaryViewState: 'off'});
        popupState.remove();
      }
    });
  }
});


async function createDictionaryPopup() {
  let popup = document.createElement('div');
  popup.className = 'dictionaryPopup';

  const currentState = await browser.storage.local.get('userDictionary');
  let dict = Array.from(currentState.userDictionary);

  let entriesToShow = "<p><b>double-click this sidebar to close it</b></p><br>";
  
  for (entry of dict) {
    const word  = "<p><b>" + entry.word + "</b>\n"
                + entry.type + ", " 
                + entry.meaning + ", " 
                + entry.origin + "</p>";
                
    entriesToShow += word;
  }
  
  popup.innerHTML = entriesToShow;
  document.body.appendChild(popup);
  return popup;
}
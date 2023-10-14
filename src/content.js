/// This is the monitor for user lookup requests: it looks out for the user double-clicking a word and checks the dictionary for that word, making an info popup in the DOM.

// document.addEventListener('dblclick', function(event) {
//   const selectedText = window.getSelection().toString();
//   if (selectedText != null) {
//     // TODO: handle the selected word by parsing it through a dictionary
//   }
//
//   console.log(selectedText);
// });

document.addEventListener('dblclick', function(event) {
  const selectedText = window.getSelection().toString();
  // console.log(selectedText + " : " + selectedText.length);

  if (selectedText == null || selectedText.length == 1 || selectedText.length == 0) {
    /// the user is clicking on whitespace, or maybe punctuation. Do not show.
    return;
  }
  
  // Create a popup element
  var popup = document.createElement('div');
  popup.className = 'infoPopup';
  popup.innerText = 'Your text here';

  // Set the position of the popup
  popup.style.position = 'absolute';
  popup.style.left = (event.clientX + window.scrollX -60) + 'px';
  popup.style.top = (event.clientY + window.scrollY -60) + 'px';

  // Add the popup to the document
  document.body.appendChild(popup);

  // Remove the popup after a certain amount of time (e.g., 2 seconds)
  setTimeout(function() {
    popup.remove();
  }, 3000);
});


// !function name(){} (); auto-runs the code as soon as it is loaded in to the DOM.
!function appendStyle(){
  var style = document.createElement('style');
  style.textContent = `
    .infoPopup {
      background-color: #ff6d6d;
      border: 1px solid #ccc;
      padding: 5px;
      font-family: 'Times New Roman', Times, serif;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);
}();
/// This is the monitor for user lookup requests: it looks out for the user double-clicking a word and checks the dictionary for that word, making an info popup in the DOM.

document.addEventListener('dblclick', function(event) {
  const selectedText = window.getSelection().toString();
  if (selectedText != null) {
    // TODO: handle the selected word by parsing it through a dictionary
  }
  console.log(selectedText);
});

document.addEventListener('dblclick', function(event) {
  const selectedText = window.getSelection().toString();
  if (selectedText != null) {
    // TODO: handle the selected word by parsing it through a dictionary
  }
  console.log(selectedText);
});

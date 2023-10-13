
// Listen for mouseover events on all elements
document.addEventListener('mouseover', function(event) {
  
  // Get the word that the user is hovering over
  var word = event.target.textContent;
  console.log("mouseon!")
  console.log("------" + word);


  // // Create a popup element
  // var popup = document.createElement('div');
  // popup.className = 'my-popup';

  // // Add the word to the popup element
  // popup.textContent = word;

  // // Position the popup element over the mouse
  // popup.style.left = event.clientX + 'px';
  // popup.style.top = event.clientY + 'px';

  // Add the popup element to the document
  // document.body.appendChild(popup);
});

// Listen for mouseout events on all elements
document.addEventListener('mouseout', function(event) {
  // Remove the popup element from the document
  // document.body.removeChild(event.target);
  console.log("mouseoff!") 
});
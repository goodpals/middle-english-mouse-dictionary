chrome.runtime.onMessage.addListener(function(message) {
  document.querySelector("#word").textContent = message.word;
});

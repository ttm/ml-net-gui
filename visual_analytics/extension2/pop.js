console.log('ads');
console.log('loaded');
const checkPageButton = document.getElementById('magic');
window.cccc = checkPageButton;
checkPageButton.style.backgroundColor = '#ff0000';
checkPageButton.onclick = function(element) {
  console.log('clicked');
  let color = element.target.value;
  checkPageButton.style.backgroundColor = '#00ff00';
  chrome.runtime.sendMessage({ message: 'popup_msg' })
}

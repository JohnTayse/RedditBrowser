import { router } from './modules/router.js';

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
if(window.location.hash === ''){
	window.location = '#';
}

browser.setAudioMuted(true);

$('#audioMutedButton').click(function(){
	var audioMuted = browser.getAudioMuted();
	browser.setAudioMuted(!audioMuted);
});
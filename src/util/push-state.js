import { inBrowser } from './dom';
import { saveScrollPosition } from './scroll';
import { genStateKey, setStateKey, getStateKey } from './state-key';
import { extend } from './misc';

// eslint-disable-next-line wrap-iife
export const supportsPushState = inBrowser && (function () {
	const ua = window.navigator.userAgent;
	if (
		(ua.includes('Android 2.') || ua.includes('Android 4.0'))
		&& ua.includes('Mobile Safari')
		&& !ua.includes('Chrome')
		&& !ua.includes('Windows Phone')
	) {
		return false;
	}
	return window.history && 'pushState' in window.history;
})();

export function pushState(url, isReplace) {
	saveScrollPosition();
	const history = window.history;
	try {
		if (isReplace) {
			const stateCopy = extend({}, history.state);
			stateCopy.key = getStateKey();
			history.replaceState(stateCopy, '', url);
		} else {
			history.pushState({ key: setStateKey(genStateKey) }, '', url);
		}
	} catch (e) {
		window.location[isReplace ? 'replace' : 'assign'](url);
	}
}

export function replaceState(url) {
	pushState(url, true);
}
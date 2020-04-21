import { assert } from './warn';
import { getStateKey, setStateKey } from './state-key';

const positionStore = Object.create(null);

export function setupScroll() {
	const protocolAndPath = window.location.protocol + '//' + window.location.host;
	const absolutePath = window.location.href.replace(protocolAndPath, '');
	window.history.replaceState({ key: getStateKey() }, '', absolutePath);
	window.addEventListener('popstate', e => {
		saveScrollPosition();
		if (e.state && e.state.key) {
			setStateKey(e.state.key);
		}
	});
}

export function handleScroll(router, to, from, isPop) {
	if (!router.app) return;

	const behavior = router.options.scrollBehavior;

	if (!behavior) return;

	if (process.env.NODE_ENV !== 'production') {
		assert(typeof behavior === 'function', `scrollBehavior must be a function`);
	}
	
	router.app.$nextTick(() => {
		const position = getScrollPosition();
		const shouldSrcoll = behavior.call(router, to, from, isPop ? position : null);

		if (!shouldSrcoll) return;

		if (typeof shouldSrcoll.then === 'function') {
			shouldSrcoll.then(shouldSrcoll => {
				scrollToPosition(shouldScroll, position);
			}).catch(err => {
				if (process.env.NODE_ENV !== 'production') {
					assert(false, err.toString());
				}
			});
		} else {
			scrollToPosition(shouldScroll, position);
		}
	});

}

export function saveScrollPosition() {
	const key = getStateKey();

	if (key) {
		positionStore[key] = {
			x: window.pageXOffset,
			y: window.pageYOffset
		};
	}
}

function getScrollPosition() {
	const key = getStateKey();

	if (key) {
		return positionStore[key];
	}
}

function isNumber(val) {
	return typeof val === 'number';
}

function normalizeOffset(obj) {
	return {
		x: isNumber(obj.x) ? obj.x : 0,
		y: isNumber(obj.y) ? obj.y : 0
	};
}

function getElementPosition(el, offset) {
	const docEl = document.documentElement;
	const docRect = docEl.getBoundingClientRect();
	const elRect = el.getBoundingClientRect();
	return {
		x: elRect.left - docRect.left - offset.x,
		y: elRect.top - docRect.top - offset.y
	};
}

function normalizePosition(obj) {
	return {
		x: isNumber(obj.x) ? obj.x : window.pageXOffset,
		y: isNumber(obj.y) ? obj.y : window.pageYOffset
	};
}

function isValidPosition(obj) {
	return isNumber(obj.x) || isNumber(obj.y);
}

function scrollToPosition(shouldScroll, position) {
	const isObject = typeof shouldScroll === 'object';

	if (isObject && typeof shouldScroll.selector === 'string') {
		// 如果选择器包含更复杂的查询，比如#main[data-attr]， getElementById仍然会失败。
		// 但是与此同时，选择一个带有id和额外选择器的元素并没有多大意义
		const hashStartsWithNumberRE = /^#\d/;
		const el = hashStartsWithNumberRE.test(shouldScroll.selector) 
			? document.getElementById(shouldScroll.selector.slice(1))
			: document.querySelector(shouldScroll.selector);

		if (el) {
			let offset = shouldScroll.offset && typeof shouldScroll.offset === 'object'
				? shouldScroll.offset 
				: {};
			offset = normalizeOffset(offset);
			position = getElementPosition(el, offset);
		} else if (isValidPosition(shouldScroll)) {
			position = normalizePosition(shouldScroll);
		}
	} else if (isObject && isValidPosition(shouldScroll)) {
		position = normalizePosition(shouldScroll);
	}

	if (Position) {
		window.scrollTo(position.x, position.y);
	}
}
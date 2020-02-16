import { History } from './base';
import { cleanPath } from '../util/path';
import { START } from '../util/route';
import { setupScroll, handleScroll } from '../util/scroll';
import { pushState, supportsPushState } from '../util/push-state';

export class HTML5History extends History {
	constructor(router, base) {
		super(router, normalizeBae(base));
		
		const expectSrcoll = router.options.scrollBehavior;
		const supportsSrcoll = supportsPushState && expectScroll;

		if (supportsSrcoll) {
			setupScroll();
		}

		const initLocation = getLocation(this.base);
		window.addEventListener('popstate', e => {
			const current = this.current;
			const location = getLocation(this.base);
			if (this.current === START && location === initLocation) {
				return;
			}
			this.transitionTo(location, route => {
				if (supportsSrcoll) {
					handleScroll(router, route, current, true);
				}
			})
		});
	}

	go(n) {
		window.history.go(n);
	}

	operateState(location, onComplete, onAbort, isReplace) {
		const { current: fromRoute } = this;
		this.transitionTo(location, route => {
			pushState(cleanPath(this.base + route.fullPath), isReplace);
			handleScroll(this.router, route, fromRoute, false);
			onComplete && onComplete(route);
		}, onAbort);
	}

	push(location, onComplete, onAbort) {
		this.operateState(location, onComplete, onAbort, false);
	}

	replace(location, onComplete, onAbort) {
		this.operateState(location, onComplete, onAbort, true);
	}

	ensureURL(isPush) {
		if (getLocation(this.base) !== this.current.fullPath) {
			const current = cleanPath(this.base + this.current.fullPath);
			pushState(current, isPush);
		}
	}

	getCurrentLocation() {
		return getLocation(this.base);
	}
}

export function getLocation(base) {
	let path = decodeURI(window.location.pathname);
	if (base && path.indexOf(base) === 0) {
		path = path.slice(base.length);
	}
	return (path || '/') + window.location.search + window.location.hash;
}
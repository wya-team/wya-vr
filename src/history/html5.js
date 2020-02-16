import { History } from './base';
import { cleanPath } from '../util/path';
import { START } from '../util/route';
import { setupScroll, handleScroll } from '../util/scroll';
import { pushState, replaceState, supportsPushState } from '../util/push-state';

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

	push(location, onComplete, onAbort) {
		const { current: fromRoute } = this;
		this.transitionTo(location, route => {
			pushState(cleanPath(this.base + route.fullPath));
			handleScroll(this.router, route, fromRoute, false);
			onComplete && onComplete(route);
		}, onAbort);
	}

	replace(location, onComplete, onAbort) {
		const { current: fromRoute } = this;
		this.transitionTo(location, route => {
			replaceState(cleanPath(this.base + route.fullPath));
			handleScroll(this.router, route, fromRoute, false);
			onComplete && onComplete(route);
		}, onAbort);
	}

	ensureURL(push) {
		if (getLocation(this.base) !== this.current.fullPath) {
			const current = cleanPath(this.base + this.current.fullPath);
			push ? pushState(current) : replaceState(current);
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
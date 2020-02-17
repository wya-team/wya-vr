import { install } from './install';
import { inBrowser } from './util/dom';
import { assert } from './util/warn';
import { createMatcher } from './create-matcher';
import { HTML5History, getLocation } from './history/html5';
import { AbstractHistory } from './history/abstract';


export default class Router {
	constructor(options = {}) {
		this.app = null;
		this.options = options;
		this.resolveHooks = [];
		this.beforeHooks = [];
		this.afterHooks = [];
		this.matcher = createMatcher(options.routes || [], this);

		let mode = options.mode || 'html5';

		if (!inBrowser) {
			mode = 'abstract';
		}
		this.mode = mode;

		switch (this.mode) {
			case 'html5':
				this.history = new HTML5History();
				break;
			case 'abstract':
				this.history = new AbstractHistory();
				break;
			default:
				if (process.env.NODE_ENV !== 'production') {
					assert(false, `invalid mode: ${mode}`);
				}
		}
	}

	init(app) {
		process.env.NODE_ENV !== 'production' && assert(
			install.installed,
			`router not installed`
		);
		this.app = app;
		const history = this.history;

		if (history instanceof HTML5History) {
			history.transitionTo(getLocation(history.base));
		}

		// route改变的回调监听
		history.listen(route => {
			this.app._route = route;
		});
	}

	beforeResolve(fn) {
		return registerHook(this.resolveHooks, fn)
	}

	beforeEach(fn) {
		return registerHook(this.beforeHooks, fn);
	}

	afterEach(fn) {
		return registerHook(this.afterHooks, fn);
	}

	onReady(cb, errorCb) {
		this.history.onReady(cb, errorCb);
	}

	onError(errorCb) {
		this.history.onError(errorCb);
	}

	push(location, onComplete, onAbort) {
		if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
			return new Promise((resolve, reject) => {
			  	this.history.push(location, resolve, reject);
			});
		} else {
			this.history.push(location, onComplete, onAbort);
		}
	}

	replace(location, onComplete, onAbort) {
		if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
			return new Promise((resolve, reject) => {
			  this.history.replace(location, resolve, reject)
			});
		} else {
			this.history.replace(location, onComplete, onAbort);
		}
	}

	go(n) {
		this.history.go(n);
	}

	back() {
		this.go(-1);
	}

	forward() {
		this.go(1);
	}

}

function registerHook(list, fn) {
	list.push(fn);
	return () => {
		if (list.includes(fn)) {
			list.splece(i, 1);
		}
	};
}

Router.install = install;

if (inBrowser && window.app) {
	window.app.use(Router);
}
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
		this.beforeHooks = [];
		this.afterHooks = [];
		this.matcher = createMatcher(options.routes || []);

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

	beforeEach(fn) {
		this.beforeHooks.push(fn);
	}

	afterEach(fn) {
		this.afterHooks.push(fn);
	}

	push(location) {
		this.history.push(location);
	}

	replace(location) {
		this.history.replace(location);
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

Router.install = install;

if (inBrowser && window.app) {
	window.app.use(Router);
}
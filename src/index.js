import { install } from './install';
import { inBrowser } from './util/dom';
import { assert } from './util/warn';
import { createMatcher } from './create-matcher';
import { HTML5History } from './history/html5';
import { AbstractHistory } from './history/abstract';


export default class Router {
	constructor(options = {}) {
		let mode = options.mode || 'html5';
		this.matcher = createMatcher(options.routes || []);

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

	init() {
		
	}
}

Router.install = install;

if (inBrowser && window.app) {
	window.app.use(Router);
}
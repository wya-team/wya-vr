import View from './components/view';
import Link from './components/link';

export function install(Vue) {

	Object.defineProperty(Vue.prototype, '$router', {
		get() {
			return this._routerRoot._router;
		}
	});

	Object.defineProperty(Vue.prototype, '$route', {
		get() {
			return this._routerRoot._route;
		}
	});

	Vue.component('RouterView', View);
	Vue.component('RouterLink', Link);
}
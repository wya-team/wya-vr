import View from './components/view';
import Link from './components/link';

// eslint-disable-next-line import/no-mutable-exports
export let _Vue;

export function install(Vue) {
	if (install.installed) return;

	install.installed = true;

	_Vue = Vue;

	Vue.mixin({
		beforeCreate() {
			if (this.$options.router) {
				this._routerRoot = this;
				this._router = this.$options.router;
				this._router.init(this);
				Vue.util.defineReactive(this, '_route', this.$router.history.current);
			}
		}
	});

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
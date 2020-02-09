import View from './components/view';
import Link from './components/link';

// eslint-disable-next-line import/no-mutable-exports
export let _Vue;

export function install(Vue) {
	if (install.installed) return;

	install.installed = true;

	_Vue = Vue;

	const isDef = v => v !== undefined;

	const registerInstance = (vm, callVal) => {
		let i = vm.$options._parentVnode;
		if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
			i(vm, callVal);
		}
	}

	Vue.mixin({
		beforeCreate() {
			// 根组件的$options上才有router对象
			if (isDef(this.$options.router)) {
				this._routerRoot = this;
				this._router = this.$options.router;
				this._router.init(this);
				// 为_route属性实现双向绑定
				Vue.util.defineReactive(this, '_route', this.$router.history.current);
			} else {
				this._routerRoot = (this.$parent && this.$parent._routerRoot) || this；
			}
			// 注册<router-view></router-view>实例的钩子
			registerInstance(this, this);
		},
		destroyed () {
		  registerInstance(this);
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

	// 使用和created相同的合并策略
	const strats = Vue.config.optionMergeStrategies;
	strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created;
}
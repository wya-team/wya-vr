import View from './components/view';
import Link from './components/link';

// eslint-disable-next-line import/no-mutable-exports
export let _Vue;

export function install(Vue) {
	// instanlled 方法和 _Vue 对象联合判断,避免重复安装
	if (install.installed && _vue === Vue) return;
	// 安装标志
	install.installed = true;

	_Vue = Vue;

	const isDef = v => v !== undefined;
	// 取父节点的 data 中的 registerRouteInstance 方法进行注册，callVal不为空是注册，为空是注销
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
				this._routerRoot = this; // 根Vue实例
				this._router = this.$options.router; // 当前router对象
				this._router.init(this); // 初始化router
				// 为_route属性实现双向绑定
				Vue.util.defineReactive(this, '_route', this.$router.history.current);
			} else {
				this._routerRoot = (this.$parent && this.$parent._routerRoot) || this; // 取根Vue实例
			}
			// 注册route实例的钩子
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

	// 挂载 beforeRouteEnter、beforeRouteLeave、beforeRouteUpdate 方法到 Vue 上
	const strats = Vue.config.optionMergeStrategies;
	strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created;
}
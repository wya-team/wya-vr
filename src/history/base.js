import { _Vue } from '../install';
import { START, isSameRoute } from '../util/route';
import { runQueue } from '../util/async';
import { isError, isExtendedError, warn } from '../util/warn';
import { resolveAsyncComponents, flatMapComponents } from '../util/resolve-components';

function extractGuard(def, key) {
	if (typeof def !== 'function') {
		def = _Vue.extend(def);
	}
	return def.options[key];
}

// extractGuards 从 RouteRecord 数组中提取各个阶段的守卫。
function extractGuards(records, name, bind, reverse) {
	//  flatMapComponents 方法去从 records 中获取所有的导航。
	const guards = flatMapComponents(records, (def, instance, match, key) => {
		const guard = extractGuard(def, name);
		if (guard) {
			  return Array.isArray(guard) ? 
			  	guard.map(guard => bind(guard, instance, match, key))
				: bind(guard, instance, match, key);
		}
	});
	return flatten(reverse ? guards.reverse() : guards);
}

// 把组件的实例 instance 作为函数执行的上下文绑定到 guard 上。
function bindGuard(guard, instance) {
	if (instance) {
		return function boundRouteGuard () {
			return guard.apply(instance, arguments);
		}
	}
}

function extractEnterGuards() {

}

function extractLeaveGuards(deactivated) {
	return extractGuards(deactivated, 'beforeRouteLeave', bindGuard, true);
}

function extractUpdateHooks() {

}

export class History {
	constructor(router, base) {
		this.router = router;
		this.base = base;
		this.current = START;
		this.pending = null;
		this.ready = false;
		this.readyCbs = [];
		this.readyErrorCbs = [];
		this.errorCbs = [];
	}

	listen(cb) {
		this.cb = cb;
	}

	onReady(cb, errorCb) {
		if (this.ready) {
			cb();
		} else {
			this.readyCbs.push(cb);
			if (errorCb) {
				this.readyErrorCbs.push(errorCb);
			}
		}
	}

	onError(errorCb) {
		this.errorCbs.push(errorCb);
	}

	/**
	 * 用来处理理由变换中的逻辑及回调, 触发它的调用replace、push、go
	 */
	transitionTo(location, onComplete, onAbort) {
		// 传入的值和当前值对比，返回相应的路由对象
		const route = this.$router.math(location, this.current);
		// 判断新路由是否有效，是否和当前路由相同
		this.confirmTransition(route, () => {
			this.updateRoute(route); // 更新路由对象，并且对视图进行更新
			onComplete && onComplete(route);
			this.ensureURL(); // 更新路径

			// 保证只触发一次ready回调
			if (!this.ready) {
				this.ready = true;	
				this.readyCbs.forEach(cb => { cb(route); });
			}
		}, err => {
			onAbort && onAbort(err);
			if (err && !this.ready) {
				this.ready = true;
				this.readyErrorCbs.forEach(cb => {
					cb(err);
				});
			}
		});
	}

	updateRoute(route) {
		const prev = this.current;
		this.current = route;
		this.cb && this.cb(route);
		this.router.afterHooks.forEach(hook => {
			hook && hook(route, prev);
		});
	}

	confirmTransition(route, onComplete, onAbort) {
		const current = this.current;
		const abort = err => {
			// isExtendedError 处理当历史堆栈中出现两个连续的相同路由时，返回到抽象模式
			if (!isExtendedError(NavigationDuplicated, err) && isError(err)) {
				if (this.errorCbs.length) {
					this.errorCbs.forEach(cb => cb(err));
				} else {
					warn(false, 'uncaught error during route navigation:');
					console.error(err);
				}
			}
			onAbort && onAbort(err);
		};

		// 如果是相同路由则不跳转
		if (isSameRoute(route, current) && route.matched.length === current.matched.length) {
			this.ensureURL();
			return abort();
		}

		const {
			updated, // 可复用的组件路由信息数组
			deactivated, // 失活的组件路由信息数组
			activated // 需要渲染的组件路由信息数组
		} = resolveQueue(this.current.matched, route.matched);
		
		// 导航守卫数组
		const queue = [].concat(
			extractLeaveGuards(deactivated), // 执行失活组件的beforeRouteLeave钩子
			this.router.beforeHooks, // 执行全局的beforeEach钩子
			extractUpdateHooks(updated), // 执行可复用组件的beforeRouteUpdate钩子
			activated.map(c => c.beforeEnter), // 执行需要渲染组件的beforeEnter钩子
			resolveAsyncComponents(activated) // 解析异步组件
		);

		this.pending = route; // 保存要跳转的路由

		// iterator迭代器函数用来执行queue中导航守卫函数
		const iterator = (hook, next) => {
			if (this.pending !== route) {
				return abort();
			}
			try {
				hook(route, current, to => {
					// 如果用户在使用导航守卫写了next(false)，那么中断跳转
					if (to === false || isError(to)) {
						this.ensureURL(true);
						abort(to);
					} else if (
						typeof to === 'string' 
						|| (typeof to === 'object' && (typeof to.path === 'string' 
						|| typeof to.name === 'string'))
					) {
						// 中断 next('/') or next({ path: '/' }) -> redirect
						abort();
						if (typeof to === 'object' && to.replace) {
							this.replace(to);
						} else {
							this.push(to);
						}
					} else {
						next(to); // 执行队列的下一个任务
					}
				});
			} catch (e) {
				abort(e);
			}
		};

		// 执行任务队列
		runQueue(queue, iterator, () => {
			// 任务队列queue执行完后
			const postEnterCbs = []; // 保存 `beforeRouteEnter` 钩子中的回调函数
			const isValid = () => this.current === route;
			// 异步组件加载完成后（队列的最后一个任务），会执行这个回调，也就是 runQueue 的 cb
			// 接下来执行需要渲染组件的导航守卫钩子
			const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid);
			const queue = enterGuards.concat(this.router.resolveHooks); // beforeResolve 导航守卫钩子
			runQueue(queue, iterator, () => {
				if (this.pending !== route) {
					return abort();
				}
				
				this.pending = null;
				onComplete(route); // afterEach 导航守卫钩子
				// 执行 beforeRouteEnter 导航守卫钩子，beforeRouteEnter 钩子不能访问 this 对象，因为钩子在导航确认前被调用，需要渲染的组件还没被创建。
				// 但是该钩子函数是唯一一个支持在回调中获取 this 对象的函数，回调会在路由确认执行。
				if (this.router.app) {
					this.router.app.$nextTick(() => {
						postEnterCbs.forEach(cb => { cb(); });
					});
				}
			});
		});

	}

	// current = [{ path: '/foo', ... }]
	// next = [{ path: '/foo', ... }, { path: '/foo/child/:id' }]
	resolveQueue(current, next) {
		const max = Math.max(current.length, next.length);
		for (let i = 0; i < max; i++) {
			// 找到cuurent不等于next的索引i，也就是匹配到的child
			if (current[i] !== next[i]) {
				break;
			}
		}
		// 当 /foo/child/:id 到 /foo 时，那么 deactivated 则是 [{ path: '/foo/child/:id', ... }] 了
		return {
			updated: next.slice(0, i),
			activated: next.slice(i),
			deactivated: current.slice(i)
		}
	}
}

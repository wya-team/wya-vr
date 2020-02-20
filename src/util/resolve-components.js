
import { warn, isError } from './warn';

function isESModule(obj) {
    return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module');
}

export function resolveAsyncComponents(matched) {
    return (to, from, next) => {
        let hasAsync = false;
        let pending = 0;
        let error = null;

        flatMapComponents(matched, (def, _, match, key) => {
            if (typeof def === 'function' && def.cid === undefined) {
                hasAsync = true;
                pending++;
                const resolve = once(resolvedDef => {

                    if (isESModule(resolvedDef)) {
                        resolvedDef = resolvedDef.default;
                    }

                    def.resolved = typeof resolvedDef === 'function'
                        ? resolvedDef
                        : _Vue.extend(resolvedDef);
                    match.components[key] = resolvedDef;
                    pending--;

                    if (pending <= 0) {
                        next();
                    }

                });
                const reject = once(reason => {
                    const msg = `Failed to resolve async component ${key}: ${reason}`;
                    process.env.NODE_ENV !== 'production' && warn(false, msg);
                    if (!error) {
                        error = isError(reason)
                        ? reason
                        : new Error(msg);
                        next(error);
                    }
                });
                let res;
                try {
                    res = def(resolve, reject);
                } catch (e) {
                    reject(e);
                }
                if (res) {
                    if (typeof res.then === 'function') {
                        res.then(resolve, reject);
                    } else {
                        const comp = res.component;
                        if (comp && typeof comp.then === 'function') {
                            comp.then(resolve, reject);
                        }
                    }
                }
            }
        });

        if (!hasAsync) {
            next();
        }
    };
}

export function flatMapComponents(matched, fn) {
    return flatten(matched.map(m => {
        return Object.keys(m.components).map(key => fn(
            m.components[key],
            m.instances[key],
            m,
            key
        ));
    }));
}

export function flatten(arr) {
    return Array.prototype.concat.apply([], arr);
}
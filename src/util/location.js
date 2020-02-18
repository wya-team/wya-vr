
import { extend } from './misc';
import { fillParams } from './params';
import { parsePath, resolvePath } from './path';
import { resolveQuery } from './query';
import { warn } from './warn';

export function normalizeLocation(raw, current, append, router) {
    // /abc?foo=bar&baz=qux#hello 转化成
    // location = {
    // _normalized: true,
    // path: '/abc',
    // hash: 'hello',
    // query: {
    //     foo: 'bar',
    //     baz: 'qux',
    // },
    // }
    let next = typeof raw === 'string' ? { path: raw } : raw;

    if (next._normalized) {
        return next;
    } else if (next.name) {
        next = extend({}, raw);
        const params = next.params
        if (params && typeof params === 'object') {
            next.params = extend({}, params);
        }
        return next;
    }

    if (!next.path && next.params && current) {
        next = extend({}, next);
        next._normalized = true;
        const params = extend(extend({}, current.params), next.params);

        if (current.name) {
            next.name = current.name;
            next.params = params;
        } else if (current.matched.length) {
            const rawPath = current.matched[current.matched.length - 1].path;
            next.path = fillParams(rawPath, params, `path ${current.path}`);
        } else if (process.env.NODE_ENV !== 'production') {
            warn(false, `relative params navigation requires a current route.`)
        }
        return next;
    }

    const parsedPath = parsePath(next.path || '');
    const basePath = (current && current.path) || '/';
    const path = parsedPath.path
        ? resolvePath(parsedPath.path, basePath, append || next.append)
        : basePath;
    const query = resolveQuery(
        parsedPath.query,
        next.query,
        router && router.options.parseQuery
    );

    return {
        _normalized: true,
        path,
        query,
    };
}
import { cleanPath } from './util/path';
import { assert, warn } from './util/warn';

export function createRouteMap(routes) {
	const pathMap = Object.create(null);
	const nameMap = Object.create(null);

	routes.forEach(route => {
		addRouteRecord(pathMap, nameMap, route);
	});

	return {
		pathMap,
		nameMap
	};
}

function normalizePathFunc(path, parent, strict) {
	if (!strict) path = path.replace(/\/$/, '');
	if (path[0] === '/') return path;
	if (parent === null) return path;
	return cleanPath(`${parent.path}/${path}`);
}

function addRouteRecord(parhMap, nameMap, route, parent) {
	const { path, name } = route;

	if (process.env.NODE_ENV !== 'production') {
		assert(path != null, `"path" is required in a route configuration.`);
		assert(
			typeof route.component !== 'string',
			`route config "component" for path: ${String(
				path || name
			)} cannot be a string id. Use an actual component instead.`
		);
	}
	const pathToRegexpOptions = route.pathToRegexpOptions || {};
	const normalizePath = normalizePathFunc(path, parent, pathToRegexpOptions.strict);
	const record = {
		path: normalizePath,
		components: route.components || { default: route.component },
		instances: {},
		name,
		parent,
		redirect: route.redirect,
		beforeEnter: route.beforeEnter,
		meta: route.meta || {},
		props: route.props == null ? {}
			: route.components
				? route.props
				: { default: route.props }
	};

	if (route.children) {
		addRouteRecord(pathMap, nameMap, child, record);
	}

	pathMap[record.path] = record;

	if (name) {
		nameMap[name] = record;
	}
}
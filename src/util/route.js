import { stringifyQuery } from './query';

const trailingSlashRE = /\/?$/;

function isObjectEqual(a = {}, b = {}) {
	if (!a || !b) return a === b; 
	
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);

	if (aKeys.length !== bKeys.length) {
		return false;
	}

	return aKeys.every(key => {
		const aVal = a[key];
		const bVal = b[key];

		if (typeof aVal === 'object' && typeof bVal === 'object') {
			return isObjectEqual(aVal, bVal);
		}

		return String(aVal) === String(bVal);
	});
}

export function createRoute(record, location, redirectedFrom, router) {
	// 字符串化查询参数
	const stringifyQuery = router && router.options.stringifyQuery;
	const { name, path, hash, query, params } = location;

	query = clone(query);
	const route = {
		name: name || (record && record.name),
		meta: (record && record.meta) || {},
		path: path || '/',
		hash: hash || '',
		query: query || {},
		params: params || {},
		fullPath: getFullPath(location, stringifyQuery),
		matched: record ? formatMatch(record) : []
	};

	if (redirectedFrom) {
		route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery);
	}
	return Object.freeze(route);
}


export const START = createRoute(null, {
	path: '/'
});

function getFullPath({ path, query = {}, hash = '' }, _stringifyQuery) {
	const stringify = _stringifyQuery || stringifyQuery;
	return (path || '/') + stringify(query) + hash;
}

function clone(value) {
	if (Array.isArray(value)) {
		return value.map(clone);
	} else if (value && typeof value === 'object') {
		const res = {};
		for (const key in value) {
			res[key] = clone(value[key]);
		}
		return res;
	} else {
		return value;
	}
}

export function isSameRoute(a, b) {
	if (!b) {
		return false;
	} else if (a.path && b.path) {
		return (
			// 处理/link === /link/
			a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '')
			&& isObjectEqual(a.query, b.query)
		);
	} else if (a.name && b.name) {
		a.name === b.name
		&& isObjectEqual(a.query, b.query) 
		&& isObjectEqual(a.params, b.params);
	} 
	return false;
}

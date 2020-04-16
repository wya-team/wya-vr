import Regexp from 'path-to-regexp';
import { createRouteMap } from './create-route-map';
import { resolvePath, getFullPath } from './util/path';
import { fillParams, regexpCompileCache } from './util/params';
import { normalizeLocation } from './util/location';

export function createMatcher(routes, router) {
	const { pathMap, nameMap } = createRouteMap(routes);

	function match(location, currentLocation) {
		location = normalizeLocation(location, currentLocation);
		const { name } = location;

		if (name) {
			const record = nameMap[name];

			if (record) {
				location.path = fillParams(record.path, location.params, `named route "${name}"`);
				return createRouteContext(record, location);
			}
		} else {
			location.params = {};
			for (const path in pathMap) {
				if (matchRoute(path, location.params, location.path)) {
					return createRouteContext(pathMap[path], location);
				}
			}
		}
	}

	function createRouteContext(record, location) {
		if (record.redirect) {
			return redirect(record, location);
		}
		if (record.alias) {
			return alias(record, location);
		}
		return Object.freeze({
			name: location.name,
			path: location.path,
			hash: location.hash,
			query: location.query,
			params: location.params,
			fullPath: getFullPath(location),
			matched: formatMatch(record)
		});
	}

	function redirect(record, location) {
		const { query, hash, params } = location;
		const { redirect } = record;
		const name = typeof redirect === 'object' && redirect.name;

		if (name) {
			const targetRecord = nameMap[name];
			if (!targetRecord) {
				throw new Error(`[router] redirect failed: named route "${name}" not found.`);
			}
			return match({
				_normalized: true,
				name,
				query,
				hash,
				params
			});
		} else if (typeof redirect === 'string') {
			const rawPath = resolveRecordPath(redirect, record);
			const path = fillParams(rawPath, params, `redirect route with path "${rawPath}"`);
			return match({
				_normalized: true,
				path,
				query,
				hash,
			});
		}
	}

	function alias(record, location) {
		const { query, hash, params } = location;
		const rawPath = resolveRecordPath(record.alias, record);
		const aliasedPath = fillParams(rawPath, params, `alias route with path "${rawPath}"`);
		const aliasedMatch = match({
			_normalized: true,
			path: aliasedPath
		});
		if (aliasedMatch) {
			const matched = aliasedMatch.matched;
			const aliasedRecord = matched[matched.length - 1];
			location.params = aliasedMatch.params;
			return createRouteContext(aliasedRecord, location);
		}
	}
	
	return match;
}

function matchRoute(path, params, pathname) {
	let keys; let 
		regexp;
	const hit = regexpCompileCache[path];

	if (hit) {
		keys = hit.keys;
		regexp = hit.regexp;
	} else {
		keys = [];
		regexp = Regexp(path, keys);
		regexpCompileCache[path] = { keys, regexp };
	}

	const m = pathname.match(regexp);

	if (!m) {
		return false;
	} else if (!params) {
		return true;
	}

	for (let i = 1, len = m.length; i < len; ++i) {
		const key = keys[i - 1];
		const val = typeof m[i] === 'string' ? decodeURIComponent(m[i]) : m[i];
		if (key) {
			params[key.name] = val;
		}
	}
	return true;
}

function formatMatch(record) {
	const res = [];
	while (record) {
		res.unshift(record);
		record = record.parent;
	}
	return res;
}

function resolveRecordPath(path, record) {
	return resolvePath(path, record.parent ? record.parent.path : '/', true);
}
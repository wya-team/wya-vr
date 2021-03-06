import Regexp from 'path-to-regexp';
import { warn } from './warn';

const regexpCompileCache = Object.create(null);

export function fillParams(path, params = {}, routeMsg) {
	try {
		const filler = regexpCompileCache[path] || (regexpCompileCache[path] = Regexp.compile(path));
		if (typeof params.pathMatch === 'string') {
			params[0] = params.pathMatch;
		}
		return filler(params, { pretty: true });
	} catch (e) {
		if (process.env.NODE_ENV !== 'production') {
			warn(typeof params.pathMatch === 'string', `missing param for ${routeMsg}: ${e.message}`);
		}
		return '';
	} finally {
		delete params[0];
	}
}
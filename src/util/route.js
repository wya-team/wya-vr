
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

export function createRoute() {
	const route = {};
	return Object.freeze(route);
}

export const START = createRoute(null, {
	path: '/'
});

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

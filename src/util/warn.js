export function assert(condition, message) {
	if (!condition) {
		throw new Error(`[vr-router] ${message}`);
	}
}

export function isError(err) {
	return Object.prototype.toString.call(err).indexOf('Error') > -1;
}

export function warn(condition, message) {
	if (process.env.NODE_ENV !== 'production' && !condition) {
		typeof console !== 'undefined' && console.warn(`[vr-router]${message}`);
	}
}

export function isExtendedError(constructor, err) {
	return err instanceof constructor || (err && err.name === constructor.name);
}
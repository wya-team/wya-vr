
export function getFullPath ({ path, query = {}, hash = '' }) {
    return path + stringifyQuery(query) + hash
}

export function cleanPath(path) {
    return path.replace(/\/\//g, '/');
}

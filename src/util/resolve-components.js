export function resolveAsyncComponents() {

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
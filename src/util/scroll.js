import { assert } from './warn'
import { getStateKey, setStateKey } from './state-key'


const positionStore = Object.create(null);

export function setupScroll() {
    const protocolAndPath = window.location.protocol + '//' + window.location.host;
    const absolutePath = window.location.href.replace(protocolAndPath, '');
    window.history.replaceState({ key: getStateKey() }, '', absolutePath);
    window.addEventListener('popstate', e => {
        saveScrollPosition();
        if (e.state && e.state.key) {
            setStateKey(e.state.key);
        }
    });
}

export function handleScroll(router, to, from, isPop) {
    if (!router.app) return;

    const behavior = router.options.scrollBehavior;

    if (!behavior)  return;

    if (process.env.NODE_ENV !== 'production') {
        assert(typeof behavior === 'function', `scrollBehavior must be a function`);
    }
    
    router.app.$nextTick(() => {
        const position = getScrollPosition();
        const shouldSrcoll = behavior.call(router, to, from, isPop ? position : null);

        if (!shouldSrcoll) return;

        if (typeof shouldSrcoll.then === 'function') {
            shouldSrcoll.then(shouldSrcoll => {
                scrollToPosition(shouldScroll, position);
            }).catch(err => {
                if (process.env.NODE_ENV !== 'production') {
                    assert(false, err.toString());
                }
            });
        } else {
            scrollToPosition(shouldScroll, position);
        }
    });

}

export function saveScrollPosition() {
    const key = getStateKey();

    if (key) {
        positionStore[key] = {
            x: window.pageXOffset,
            y: window.pageYOffset
        };
    }
}

function getScrollPosition() {
    
}

function scrollToPosition() {

}
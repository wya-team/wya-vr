import { inBrowser } from './dom';

// 使用用户定时api(如果存在)来获得更准确的精度
const Time = inBrowser && window.performance && window.performance.now 
	? window.performance : Date;

export function genStateKey() {
	return Time.now().toFixed(3);
}

let _key = genStateKey();

export function getStateKey() {
	return _key;
}

export function setStateKey(key) {
	return (_key = key);
}
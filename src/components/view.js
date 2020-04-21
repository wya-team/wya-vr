export default {
	name: 'RouterView',
	functional: true,
	props: {
		name: {
			type: String,
			default: 'default'
		}
	},
	render(h, { props, children, parent, data }) {
		data.registerRouteInstance = (vm, val) => {
			const current = matched.instances[name];
			if ((val && current !== vm) || (!val && current === vm)) {
				matched.instances[name] = val;
			}
		};
	}
};
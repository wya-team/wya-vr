export class NavigationDuplicated extends Error {
	constructor() {
		super();
		this.name = 'NavigationDuplicated';
		this.message = `Navigating to current location ("${
			normalizedLocation.fullPath
		}") is not allowed`;
	}
}
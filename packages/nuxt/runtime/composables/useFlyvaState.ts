let leavePromise: Promise<void> | null = null;
let enterPromise: Promise<void> | null = null;
let resolveEnterPromise: (() => void) | null = null;

export function useFlyvaState() {
	function start() {
		let resolveLeave: () => void = () => {};

		enterPromise = new Promise(resolve => {
			resolveEnterPromise = () => {
				resolve();
				enterPromise = null;
			};
		});

		leavePromise = new Promise(resolve => {
			resolveLeave = () => {
				resolve();
				leavePromise = null;
			};
		});

		return resolveLeave;
	}

	function finish() {
		resolveEnterPromise?.();
	}

	function getLeavePromise() {
		if (leavePromise) {
			return leavePromise;
		}

		return new Promise<void>(resolve => setTimeout(resolve));
	}

	function getEnterPromise() {
		if (enterPromise) {
			return enterPromise;
		}

		return new Promise<void>(resolve => setTimeout(resolve));
	}

	return { start, finish, getLeavePromise, getEnterPromise };
}

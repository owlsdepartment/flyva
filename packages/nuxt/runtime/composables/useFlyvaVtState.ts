let _vtActive = false;
let _domSwapResolve: (() => void) | null = null;

export function setVtActive(active: boolean) {
	_vtActive = active;
}

export function isVtActive() {
	return _vtActive;
}

export function createDomSwapPromise(): Promise<void> {
	return new Promise<void>(resolve => {
		_domSwapResolve = resolve;
	});
}

export function resolveDomSwap() {
	_domSwapResolve?.();
	_domSwapResolve = null;
}

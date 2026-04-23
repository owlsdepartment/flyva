import { afterEach } from 'vitest';

afterEach(() => {
	document.documentElement.removeAttribute('class');
	document.body.innerHTML = '';
});

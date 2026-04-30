import { getSitePrefix } from './site-base';

export function playgroundPath(segment: string): string {
	const prefix = getSitePrefix();
	const clean = segment.replace(/^\/+|\/+$/g, '');
	return `${prefix}/playground/${clean}/`;
}

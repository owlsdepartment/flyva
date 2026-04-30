export function getSitePrefix(): string {
	const raw = process.env.SITE_BASE ?? '/';
	if (raw === '/' || raw === '') return '';
	const trimmed = raw.replace(/\/+$/, '');
	return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function getVitePressBase(): string {
	const p = getSitePrefix();
	return p ? `${p}/docs/` : '/docs/';
}

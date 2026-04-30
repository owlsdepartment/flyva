import type { ReactNode } from 'react';

export async function generateStaticParams() {
	return [{ slug: 'alpha' }, { slug: 'beta' }, { slug: 'gamma' }, { slug: 'delta' }];
}

export default function WorkSlugLayout({ children }: { children: ReactNode }) {
	return children;
}

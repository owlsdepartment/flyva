import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const tagline = 'The ultimate context-aware page transitions system for Next.js and Nuxt.';
const short = 'Page transitions for Next.js and Nuxt websites';

export const metadata: Metadata = {
	title: `Flyva | ${short}`,
	description: tagline,
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}

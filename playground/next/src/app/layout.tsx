import type { Metadata } from 'next';

import { FlyvaProvider } from '@/components/FlyvaProvider';
import { Nav } from '@/components/Nav';

import './globals.css';

export const metadata: Metadata = {
	title: 'Flyva — Next.js Playground',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<FlyvaProvider>
					<Nav />
					<main data-flyva-content>{children}</main>
				</FlyvaProvider>
			</body>
		</html>
	);
}

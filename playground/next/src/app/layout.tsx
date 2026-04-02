import type { Metadata } from 'next';

import { FlyvaProvider } from '@/components/FlyvaProvider';
import { FlyvaTransitionWrapper } from '@flyva/next';
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
					<main data-flyva-content>
						<FlyvaTransitionWrapper>
							{children}
						</FlyvaTransitionWrapper>
					</main>
				</FlyvaProvider>
			</body>
		</html>
	);
}

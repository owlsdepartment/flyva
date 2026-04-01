'use client';

import { useRefStack } from '@flyva/next';
import { useRef } from 'react';

export function HeroBlock() {
	const heroRef = useRef<HTMLDivElement>(null);
	useRefStack('hero', heroRef);

	return (
		<div ref={heroRef} className="hero-block">
			<div className="hero-block-inner">
				<h2>refStack demo</h2>
				<p>
					This element is registered via <code>useRefStack(&apos;hero&apos;, ref)</code>.
					The default transition accesses it with <code>globalGetRefStackItem(&apos;hero&apos;)</code> and
					scales it down during leave. Navigate away and watch it shrink independently from the content fade.
				</p>
			</div>
		</div>
	);
}

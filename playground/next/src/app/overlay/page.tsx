import demo from '@/styles/demo-pages.module.scss';

export default function OverlayPage() {
	return (
		<div className={demo.page}>
			<div className={demo.pageContent} data-demo-page-content>
				<section className={demo.section}>
					<h1>Detached overlay</h1>
					<p>
						You used <code>FlyvaLink</code> with <code>flyvaTransition=&quot;overlayTransition&quot;</code>. The transition
						mounts a portal via <code>useDetachedRoot()</code> (React <code>createRoot</code>) and animates full-screen
						shapes on top of the app before navigation completes.
					</p>
					<p>Use the same pattern in your own transitions when you need UI that must not live inside the Next or Nuxt route tree.</p>
				</section>
			</div>
		</div>
	);
}

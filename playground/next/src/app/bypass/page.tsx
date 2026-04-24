import demo from '@/styles/demo-pages.module.scss';

export default function BypassPage() {
	return (
		<div className={demo.page}>
			<div className={demo.pageContent} data-demo-page-content>
				<section className={demo.section}>
					<h1>Bypass</h1>
					<p>
						This route is only for the nav link that sets <code>{'flyva={false}'}</code>. Navigation is a plain Next{' '}
						<code>Link</code> with no Flyva transition.
					</p>
				</section>
			</div>
		</div>
	);
}

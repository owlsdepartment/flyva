export default function BypassPage() {
	return (
		<div className="page">
			<div className="page-content">
				<section className="section">
					<h1>Bypass</h1>
					<p>
						This route is only for the nav link that sets <code>{'flyva={false}'}</code>.
						Navigation is a plain Next <code>Link</code> with no Flyva transition.
					</p>
				</section>
			</div>
		</div>
	);
}

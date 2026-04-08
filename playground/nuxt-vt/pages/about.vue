<template>
	<div class="page">
		<div class="page-content">
			<section class="section">
				<h1>About</h1>
				<p>
					You arrived here via the <strong>VT + CSS fade</strong> transition.
					The browser captured old and new snapshots and crossfaded between them
					using <code>::view-transition-old(main)</code> /
					<code>::view-transition-new(main)</code> CSS rules.
				</p>
			</section>

			<section class="section">
				<div class="card-grid">
					<div v-for="label in ['Seamless', 'Composable', 'Framework-native']" :key="label" class="card">
						<h3>{{ label }}</h3>
						<p>
							Flyva provides a {{ label.toLowerCase() }} transition layer
							between pages.
						</p>
					</div>
				</div>
			</section>
		</div>
	</div>
</template>

<template>
	<div class="page">
		<section class="section">
			<h1>About</h1>
			<p>
				You arrived here via the <strong>default fade transition</strong>.
				No <code>flyva-transition</code> prop was set on the link — it
				resolved to <code>defaultTransition</code> automatically via the
				<code>flyva.defaultKey</code> config in <code>nuxt.config.ts</code>.
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
</template>

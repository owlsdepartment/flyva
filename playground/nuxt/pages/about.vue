<script setup lang="ts">
import DemoCard from '~/components/demo/DemoCard.vue';
import DemoCardGrid from '~/components/demo/DemoCardGrid.vue';
import DemoPage from '~/components/demo/DemoPage.vue';
import DemoSection from '~/components/demo/DemoSection.vue';
</script>

<template>
	<DemoPage>
		<DemoSection>
			<h1>About</h1>
			<p>
				You arrived here via the <strong>default fade transition</strong>. No <code>flyva-transition</code> prop was set on the
				link — it resolved to <code>defaultTransition</code> automatically via the <code>flyva.defaultKey</code> config in
				<code>nuxt.config.ts</code>.
			</p>
		</DemoSection>

		<DemoSection>
			<DemoCardGrid>
				<DemoCard v-for="label in ['Seamless', 'Composable', 'Framework-native']" :key="label">
					<h3>{{ label }}</h3>
					<p>Flyva provides a {{ label.toLowerCase() }} transition layer between pages.</p>
				</DemoCard>
			</DemoCardGrid>
		</DemoSection>
	</DemoPage>
</template>

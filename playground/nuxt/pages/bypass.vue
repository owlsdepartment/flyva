<script setup lang="ts">
import DemoPage from '~/components/demo/DemoPage.vue';
import DemoSection from '~/components/demo/DemoSection.vue';
</script>

<template>
	<DemoPage>
		<DemoSection>
			<h1>Bypass</h1>
			<p>
				This route is only for the nav link that sets
				<code v-pre>:flyva="false"</code>. Navigation is a plain Nuxt link with no Flyva transition.
			</p>
		</DemoSection>
	</DemoPage>
</template>

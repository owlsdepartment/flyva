<script setup lang="ts">
import DemoPage from '~/components/demo/DemoPage.vue';
import DemoSection from '~/components/demo/DemoSection.vue';
</script>

<template>
	<DemoPage>
		<DemoSection>
			<h1>Detached overlay</h1>
			<p>
				You used <code>FlyvaLink</code> with <code>flyva-transition="overlayTransition"</code>. The transition mounts a portal via
				<code>useDetachedRoot()</code> (Vue <code>createApp</code>) and animates full-screen shapes on top of the app before navigation
				completes.
			</p>
			<p>Use the same pattern when you need UI that must not live inside the Nuxt page tree.</p>
		</DemoSection>
	</DemoPage>
</template>

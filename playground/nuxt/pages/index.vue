<script setup lang="ts">
import DemoCardGrid from '~/components/demo/DemoCardGrid.vue';
import DemoPage from '~/components/demo/DemoPage.vue';
import DemoSection from '~/components/demo/DemoSection.vue';
import DemoTestList from '~/components/demo/DemoTestList.vue';
import HeroBlock from '~/components/HeroBlock.vue';
</script>

<template>
	<DemoPage>
		<DemoSection>
			<h1>Home</h1>
			<p>
				Navigate using the links above. The <strong>About</strong> link uses the default fade transition. The
				<strong>Work</strong> link uses the slide transition when the target path is <code>/work</code>, via a
				<code>condition</code> on that transition (no <code>flyva-transition</code> on the link). Per-link
				<code>flyva-options</code> still passes <code>direction</code>.
			</p>
		</DemoSection>

		<HeroBlock />

		<DemoSection>
			<h2>What's being tested</h2>
			<DemoTestList>
				<li>
					<strong>Default transition</strong> — FlyvaLink without explicit transition name falls back to
					<code>defaultTransition</code>
				</li>
				<li>
					<strong>Transition selection</strong> — Work nav uses <code>slideTransition</code> matched by <code>condition</code> on
					the target URL; project cards use explicit <code>expandTransition</code>
				</li>
				<li>
					<strong>refStack</strong> — The hero block registers itself via <code>useRefStack</code>. The default transition accesses
					it via <code>globalGetRefStackItem</code> and animates it separately during leave
				</li>
				<li>
					<strong>Nuxt hooks</strong> — <code>page:start</code> and <code>page:finish</code> drive the leave/enter lifecycle natively
					through FlyvaPage, no manual wiring needed
				</li>
			</DemoTestList>
		</DemoSection>
	</DemoPage>
</template>

<script setup lang="ts">
import HeroBlock from '~/components/HeroBlock.vue';
</script>

<template>
	<div class="page">
		<div class="page-content">
			<section class="section">
				<h1>Home</h1>
				<p>
					Navigate using the links above. The <strong>About</strong> link uses the
					default fade transition. The <strong>Work</strong> link uses a slide
					transition selected via the <code>flyva-transition</code> prop on FlyvaLink.
				</p>
			</section>
	
			<HeroBlock />
	
			<section class="section">
				<h2>What's being tested</h2>
				<ul class="test-list">
					<li>
						<strong>Default transition</strong> — FlyvaLink without explicit transition
						name falls back to <code>defaultTransition</code>
					</li>
					<li>
						<strong>Transition selection</strong> — FlyvaLink with
						<code>flyva-transition="slideTransition"</code> uses the slide transition
					</li>
					<li>
						<strong>refStack</strong> — The hero block registers itself via
						<code>useRefStack</code>. The default transition accesses it via
						<code>globalGetRefStackItem</code> and animates it separately during leave
					</li>
					<li>
						<strong>Nuxt hooks</strong> — <code>page:start</code> and
						<code>page:finish</code> drive the leave/enter lifecycle natively through
						FlyvaPage, no manual wiring needed
					</li>
				</ul>
			</section>
		</div>
	</div>
</template>

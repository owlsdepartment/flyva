<script setup lang="ts">
import DemoCssDemoBtn from '~/components/demo/DemoCssDemoBtn.vue';
import DemoCssDemoLinks from '~/components/demo/DemoCssDemoLinks.vue';
import DemoPage from '~/components/demo/DemoPage.vue';
import DemoSection from '~/components/demo/DemoSection.vue';
import DemoTestList from '~/components/demo/DemoTestList.vue';
</script>

<template>
	<DemoPage>
		<DemoSection>
			<h1>CSS Mode</h1>
			<p>
				These transitions use <code>cssMode: true</code> — Flyva applies Vue-style stage classes (
				<code>*-leave-from</code>, <code>*-leave-active</code>, <code>*-leave-to</code>, etc.) and listens for
				<code>transitionend</code> / <code>animationend</code> to resolve. No JavaScript animation code needed.
			</p>
		</DemoSection>

		<DemoSection>
			<h2>CSS Fade</h2>
			<p>
				A simple opacity crossfade driven entirely by CSS transitions. The transition classes are derived from the key name
				<code>cssFadeTransition</code>.
			</p>
			<DemoCssDemoLinks>
				<DemoCssDemoBtn to="/" transition="cssFadeTransition">Home (fade)</DemoCssDemoBtn>
			</DemoCssDemoLinks>
		</DemoSection>

		<DemoSection>
			<h2>CSS Slide</h2>
			<p>A horizontal slide — the old page moves left and fades while the new page slides in from the right.</p>
			<DemoCssDemoLinks>
				<DemoCssDemoBtn to="/" transition="cssSlideTransition">Home (slide)</DemoCssDemoBtn>
			</DemoCssDemoLinks>
		</DemoSection>

		<DemoSection>
			<h2>How it works</h2>
			<DemoTestList>
				<li>
					<strong>Transition definition</strong> — just <code>{ cssMode: true }</code>, no leave/enter hooks
				</li>
				<li>
					<strong>Stage classes</strong> — Flyva adds <code>*-leave-from</code> + <code>*-leave-active</code>, then swaps to
					<code>*-leave-to</code> on the next frame. Same pattern for enter.
				</li>
				<li>
					<strong>Completion</strong> — detected via <code>transitionend</code> / <code>animationend</code> events
				</li>
			</DemoTestList>
		</DemoSection>
	</DemoPage>
</template>

<script setup lang="ts">
</script>

<template>
	<div class="page">
		<div class="page-content">
			<section class="section">
				<h1>Detached overlay</h1>
				<p>
					You used <code>FlyvaLink</code> with
					<code>flyva-transition="overlayTransition"</code>. The transition mounts a portal via
					<code>useDetachedRoot()</code> (Vue <code>createApp</code>) and animates full-screen
					shapes on top of the app before navigation completes.
				</p>
				<p>
					Use the same pattern when you need UI that must not live inside the Nuxt page tree.
				</p>
			</section>
		</div>
	</div>
</template>

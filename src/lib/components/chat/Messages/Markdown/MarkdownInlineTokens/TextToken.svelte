<script lang="ts">
	import { fade } from 'svelte/transition';

	export let token;
	export let done = true;

	let texts = [];
	$: texts = (token?.raw ?? '').split(' ');
</script>

{token?.raw}

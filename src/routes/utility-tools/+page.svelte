<script>
	import { utilityTools } from '$lib/utility-tools';
</script>

<h1 class="text-4xl font-bold">Utility Tools</h1>
<p class="text-lg mt-4 text-gray-300">A collection of useful tools and utilities.</p>

<div class="my-6 grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 auto-rows-min">
	{#each utilityTools as tool (tool.id)}
		<article class="relative w-full mx-auto {tool.rows ? 'row-span-' + tool.rows : ''} {tool.cols ? 'md:col-span-' + tool.cols : ''} bg-white/5 rounded-xl overflow-hidden">
			<div class="p-4 flex flex-col h-full">
				<div class="">
					<h3 class="text-lg font-semibold mt-0 ml-4">{tool.title}</h3>

					{#if tool.description}
						<p class="mt-2 text-sm text-gray-300">{tool.description}</p>
					{/if}
				</div>
				<svelte:component this={tool.component} />
			</div>
		</article>
	{/each}
</div>

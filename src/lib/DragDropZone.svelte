<script>
	import { createDragDropHandlers } from '$lib/fileDragDrop.js';

	export let onFileSelected = async (file) => {};
	export let message = 'Drop image here';
	export let class_ = '';

	const { isDragging, onDragEnter, onDragOver, onDragLeave, onDrop } = createDragDropHandlers((file) => {
		onFileSelected(file);
	});
</script>

<div
	on:dragenter={onDragEnter}
	on:dragover={onDragOver}
	on:dragleave={onDragLeave}
	on:drop={onDrop}
	role="region"
	class="relative {class_}"
	class:border-violet-500={isDragging}
>
	<slot />

	{#if $isDragging}
		<div class="absolute inset-0 flex items-center justify-center bg-black/50 text-white pointer-events-none">
			<div class="rounded-lg border-2 border-dashed border-white/70 px-6 py-3 text-center">
				{message}
			</div>
		</div>
	{/if}
</div>

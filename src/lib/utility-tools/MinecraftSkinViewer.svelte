<script context="module">
	export const title = 'Minecraft Skin Viewer';
	export const description = 'View Minecraft skins using username or using a file.';
	export const size = { rows: 2, cols: 1 };
</script>

<script>
	import SkinViewer from '$lib/3dSkinViewer.svelte';
	import DragDropZone from '$lib/DragDropZone.svelte';
	import { fileToDataURL } from '$lib/fileDragDrop.js';

	let viewerRef;
	let skinUrl = '';
	let skinUsername = '';
	let fileInput;

	let invalid = false;
	let invalidTimeout;

	async function handleFileSelected(file) {
		try {
			const dataUrl = await fileToDataURL(file);
			skinUrl = dataUrl;
			viewerRef.loadSkin(skinUrl);
		} catch (err) {
			console.error(err);
		}
	}

	async function urlImageToDataURL(url) {
		const res = await fetch(url, { mode: 'cors' });
		if (!res.ok) throw new Error('Failed to fetch image');
		const blob = await res.blob();
		return await fileToDataURL(blob);
	}

	function triggerInvalid() {
		invalid = true;
		clearTimeout(invalidTimeout);
		invalidTimeout = setTimeout(() => {
			invalid = false;
		}, 300);
	}

	function setSkinURL() {
		if (!skinUsername && !skinUrl) {
			return;
		}

		const usernameRegex = /^[a-z0-9_]{1,16}$/i;

		if (usernameRegex.test(skinUsername)) {
			skinUrl = `https://mineskin.eu/skin/${skinUsername}.png`;
			urlImageToDataURL(skinUrl).then(dataUrl => {
				skinUrl = dataUrl;
			}).catch(() => {
				triggerInvalid();
				return;
			});
		} else {
			triggerInvalid();
			return;
		}

		viewerRef.loadSkin(skinUrl);
	}

	function openFilePicker() {
		fileInput.click();
	}

	async function onFileChange(event) {
		// normalize for drop: DataTransfer -> mimic input change event with .target.files
		let files = event?.target?.files;
		const file = files?.[0];
		if (!file) return;
		try {
			handleFileSelected(file);
		} catch (err) {
			console.error(err);
		} finally {
			// if this was an input change, clear it
			if (event?.target?.value !== undefined) event.target.value = '';
		}
	}
</script>

<a href="https://www.npmjs.com/package/skinview3d"
	target="_blank"
	class="mb-2 text-sm text-blue-400 hover:text-blue-300"
>
	uses https://www.npmjs.com/package/skinview3d
</a>
<DragDropZone
	onFileSelected={handleFileSelected}
	message="Drop image to load skin"
	class_="rounded-3xl p-4"
>
	<SkinViewer bind:this={viewerRef} />

	<input
		bind:value={skinUsername}
		on:keydown={(e) => {
			if (e.key === 'Enter') {
				setSkinURL();
			}
		}}
		placeholder="Enter Minecraft username"
		class="w-full rounded-2xl border border-white/10 bg-stone-950/40 p-3 text-sm text-white outline-none"
	/>

	<div class="mt-3 flex justify-between">
		<button class="rounded-xl bg-stone-800 px-4 py-2 text-sm hover:bg-stone-700"
			on:click={setSkinURL}
		>
			Load Username Skin
		</button>

		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			class="hidden"
			on:change={onFileChange}
		/>
		<button class="rounded-xl bg-stone-800 px-4 py-2 text-sm hover:bg-slate-700"
			on:click={openFilePicker}
		>
			Use File 📂
		</button>
	</div>
</DragDropZone>
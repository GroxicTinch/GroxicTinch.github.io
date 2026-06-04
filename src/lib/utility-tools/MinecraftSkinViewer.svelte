<script context="module">
	export const title = 'Minecraft Skin Viewer';
	export const description = 'View Minecraft skins using username or using a file.';
	export const largeCard = true;
</script>

<script>
	import SkinViewer from '$lib/3dSkinViewer.svelte';

	let viewerRef;
	let skinUrl = '';
	let skinUsername = '';
	let fileInput;

	let invalid = false;
	let invalidTimeout;

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
		if (!files && event?.dataTransfer) {
			files = event.dataTransfer.files;
		}
		const file = files?.[0];
		if (!file) return;
		try {
			const dataUrl = await fileToDataURL(file);
			skinUrl = dataUrl; // use this where needed
			viewerRef.loadSkin(skinUrl);
		} catch (err) {
			console.error(err);
		} finally {
			// if this was an input change, clear it
			if (event?.target?.value !== undefined) event.target.value = '';
		}
	}

	function fileToDataURL(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = () => { reader.abort(); reject(new Error('Failed to read file')); };
			reader.onload = () => resolve(reader.result);
			reader.readAsDataURL(file);
		});
	}

	async function urlImageToDataURL(url) {
		const res = await fetch(url, { mode: 'cors' });
		if (!res.ok) throw new Error('Failed to fetch image');
		const blob = await res.blob();
		return await fileToDataURL(blob);
	}

	// drag helpers (prevent default and style feedback)
	let isDragging = false;
	let dragCounter = 0;

	function onDragEnter(e) {
		e.preventDefault();
		dragCounter++;
		if (dragCounter === 1) isDragging = true;
		try { e.dataTransfer.dropEffect = 'copy'; } catch {}
	}

	function onDragOver(e) {
		e.preventDefault();
		try { e.dataTransfer.dropEffect = 'copy'; } catch {}
	}

	function onDragLeave(e) {
		e.preventDefault();
		dragCounter = Math.max(0, dragCounter - 1);
		if (dragCounter === 0) isDragging = false;
	}

	function onDrop(e) {
		e.preventDefault();
		dragCounter = 0;
		isDragging = false;
		onFileChange(e); // keep your existing file handler
	}
</script>

<a href="https://www.npmjs.com/package/skinview3d"
	target="_blank"
	class="mb-2 text-sm text-blue-400 hover:text-blue-300"
>
	uses https://www.npmjs.com/package/skinview3d
</a>
<div
	on:dragenter={onDragEnter}
	on:dragover={onDragOver}
	on:dragleave={onDragLeave}
	on:drop={onDrop}
	role="region"
	class="relative rounded-3xl p-4"
	class:border-violet-500={isDragging}
>
	<SkinViewer bind:this={viewerRef} />

	{#if isDragging}
		<div class="absolute inset-0 flex items-center justify-center bg-black/50 text-white pointer-events-none">
			<div class="rounded-lg border-2 border-dashed border-white/70 px-6 py-3 text-center">
				Drop image to load skin
			</div>
		</div>
	{/if}

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
</div>
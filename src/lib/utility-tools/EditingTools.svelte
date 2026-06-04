<script context="module">
	export const title = 'Image and Video Editing Tools';
	export const size = { rows: 2, cols: 2 };
	export const sortPriority = -1;
</script>

<script>
	import { tick, onMount, onDestroy } from 'svelte';
	import DragDropZone from "$lib/DragDropZone.svelte";
	// @ts-nocheck
	const EDITTOOLS = {
		NONE: 'NONE',
		CROP: 'CROP',
		TRIM: 'TRIM',
	};

	let fileInput = null;
	let workingFile = null;
	let imageUrl = null;
	let isVideo = false;

	let imgStyle = '';

	let imageEl = null;
	let videoEl = null;
	let containerEl = null;
	let showCheckerboard = true;
	let imageOffset = { x: 0, y: 0 };
	let undoStack = [];

	let imageDisplaySize = { width: 0, height: 0 };
	let activeTool = EDITTOOLS.NONE;
	let isDragging = false;
	let selection = { x: 0, y: 0, width: 0, height: 0 };
	let dragStart = { x: 0, y: 0 };
	let resizeObserver = null;

	// Trim state
	let videoDuration = 0;
	let trimStart = 0;
	let trimEnd = 0;
	let trimDragging = null; // 'start' | 'end' | null
	let timelineEl = null;
	let currentTime = 0;

	// Export state
	let isExporting = false;
	let exportProgress = 0;
	let exportError = null;

	function disposeImageUrl() {
		if (imageUrl) {
			URL.revokeObjectURL(imageUrl);
			imageUrl = null;
		}
	}

	async function handleFileSelected(file) {
		try {
			workingFile = file;
			isVideo = file.type.startsWith('video/');
			disposeImageUrl();
			imageUrl = URL.createObjectURL(file);
			selection = { x: 0, y: 0, width: 0, height: 0 };
			imageDisplaySize = { width: 0, height: 0 };
			trimStart = 0;
			trimEnd = 0;
			videoDuration = 0;
			exportError = null;

			await tick();

			if (isVideo) {
				await new Promise((resolve, reject) => {
					const v = videoEl;
					if (!v) return reject(new Error('No video element'));
					const onMeta = () => {
						videoDuration = v.duration;
						trimEnd = v.duration;
						v.removeEventListener('loadedmetadata', onMeta);
						v.removeEventListener('error', onErr);
						resolve();
					};
					const onErr = () => reject(new Error('Video load error'));
					if (v.readyState >= 1 && v.duration) {
						videoDuration = v.duration;
						trimEnd = v.duration;
						resolve();
					} else {
						v.addEventListener('loadedmetadata', onMeta);
						v.addEventListener('error', onErr);
					}
				});
				// Wait for first frame to render so we can measure
				await new Promise(r => setTimeout(r, 100));
			} else {
				await new Promise((resolve, reject) => {
					if (imageEl.complete && imageEl.naturalWidth > 0) {
						resolve();
					} else {
						imageEl.addEventListener('load', resolve, { once: true });
						imageEl.addEventListener('error', reject, { once: true });
					}
				});
			}

			updateImageStyle();
			updateImageOffset();
			ensureResizeObserver();
			activeTool = EDITTOOLS.NONE;
		} catch (err) {
			console.error(err);
		}
	}

	function getMediaEl() {
		return isVideo ? videoEl : imageEl;
	}

	function getMediaNaturalSize() {
		if (isVideo) {
			return { naturalWidth: videoEl?.videoWidth || 0, naturalHeight: videoEl?.videoHeight || 0 };
		}
		return { naturalWidth: imageEl?.naturalWidth || 0, naturalHeight: imageEl?.naturalHeight || 0 };
	}

	function openFilePicker() {
		fileInput?.click();
	}

	function updateImageStyle() {
		const el = getMediaEl();
		if (!el || !containerEl) return;
		const { naturalWidth, naturalHeight } = getMediaNaturalSize();
		if (!naturalWidth || !naturalHeight) return;
		const { clientWidth: cw, clientHeight: ch } = containerEl;
		const scale = Math.min(cw / naturalWidth, ch / naturalHeight) || 1;
		const displayWidth = naturalWidth * scale;
		const displayHeight = naturalHeight * scale;
		rescaleSelection(displayWidth, displayHeight);
		imgStyle = `width: ${displayWidth}px; height: ${displayHeight}px; display: block;`;
		imageDisplaySize = { width: displayWidth, height: displayHeight };
	}

	function rescaleSelection(newWidth, newHeight) {
		if (!selection.width || !selection.height || !imageDisplaySize.width || !imageDisplaySize.height) return;
		const scaleX = newWidth / imageDisplaySize.width;
		const scaleY = newHeight / imageDisplaySize.height;
		selection = {
			x: selection.x * scaleX,
			y: selection.y * scaleY,
			width: selection.width * scaleX,
			height: selection.height * scaleY,
		};
	}

	function updateImageOffset() {
		const el = getMediaEl();
		if (!el || !containerEl) return;
		const imageRect = getImageRect();
		const containerRect = containerEl.getBoundingClientRect();
		imageOffset = {
			x: imageRect.left - containerRect.left,
			y: imageRect.top - containerRect.top,
		};
	}

	async function onFileChange(event) {
		const target = event.target;
		const files = target?.files;
		const file = files?.[0];
		if (!file) return;
		try {
			pushUndo(workingFile);
			handleFileSelected(file);
		} catch (err) {
			console.error(err);
		} finally {
			if (target?.value !== undefined) target.value = '';
		}
	}

	function pushUndo(file) {
		if (!file) return;
		undoStack.push(file);
	}

	function undo() {
		const previous = undoStack.pop();
		if (!previous) return;
		handleFileSelected(previous);
	}

	function closeImage() {
		disposeImageUrl();
		workingFile = null;
		imageUrl = null;
		isVideo = false;
		selection = { x: 0, y: 0, width: 0, height: 0 };
		imageDisplaySize = { width: 0, height: 0 };
		activeTool = EDITTOOLS.NONE;
		trimStart = 0;
		trimEnd = 0;
		videoDuration = 0;
		exportError = null;
	}

	function ensureResizeObserver() {
		if (!resizeObserver) {
			resizeObserver = new ResizeObserver(() => {
				updateImageStyle();
				updateImageOffset();
			});
		}
		if (containerEl) {
			resizeObserver.disconnect();
			resizeObserver.observe(containerEl);
		}
	}

	onMount(() => {
		ensureResizeObserver();
	});

	onDestroy(() => {
		if (resizeObserver) resizeObserver.disconnect();
	});

	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}

	function getImageRect() {
		const el = getMediaEl();
		return el?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
	}

	function startSelection(event) {
		if (activeTool !== EDITTOOLS.CROP || !getMediaEl() || !containerEl) return;
		updateImageOffset();
		const imageRect = getImageRect();
		const x = clamp(event.clientX - imageRect.left, 0, imageRect.width);
		const y = clamp(event.clientY - imageRect.top, 0, imageRect.height);
		isDragging = true;
		dragStart = { x, y };
		selection = { x, y, width: 0, height: 0 };
	}

	function updateSelection(event) {
		if (!isDragging || activeTool !== EDITTOOLS.CROP || !getMediaEl() || !containerEl) return;
		const imageRect = getImageRect();
		const x = clamp(event.clientX - imageRect.left, 0, imageRect.width);
		const y = clamp(event.clientY - imageRect.top, 0, imageRect.height);
		const left = Math.min(dragStart.x, x);
		const top = Math.min(dragStart.y, y);
		selection = {
			x: left,
			y: top,
			width: Math.abs(x - dragStart.x),
			height: Math.abs(y - dragStart.y),
		};
	}

	function endSelection() {
		if (activeTool !== EDITTOOLS.CROP) return;
		isDragging = false;
	}

	async function cropImage() {
		if (!imageEl || !workingFile || selection.width === 0 || selection.height === 0) return;
		pushUndo(workingFile);
		const { naturalWidth, naturalHeight } = getMediaNaturalSize();
		const displayWidth = imageEl.clientWidth;
		const displayHeight = imageEl.clientHeight;
		const scaleX = naturalWidth / displayWidth;
		const scaleY = naturalHeight / displayHeight;
		const sx = Math.round(selection.x * scaleX);
		const sy = Math.round(selection.y * scaleY);
		const sWidth = Math.round(selection.width * scaleX);
		const sHeight = Math.round(selection.height * scaleY);
		const canvas = document.createElement('canvas');
		canvas.width = sWidth;
		canvas.height = sHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.drawImage(imageEl, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
		const blob = await new Promise((resolve) => canvas.toBlob(resolve, workingFile.type || 'image/png'));
		if (!blob) return;
		const croppedFile = new File([blob], workingFile.name || 'cropped.png', { type: workingFile.type || 'image/png' });
		handleFileSelected(croppedFile);
		activeTool = EDITTOOLS.NONE;
	}

	// ── Timeline drag ──────────────────────────────────────────────────

	function getTimelineFraction(clientX) {
		if (!timelineEl) return 0;
		const rect = timelineEl.getBoundingClientRect();
		return clamp((clientX - rect.left) / rect.width, 0, 1);
	}

	function onTimelineMouseDown(event, handle) {
		trimDragging = handle;
		event.preventDefault();
	}

	function onTimelineMouseMove(event) {
		if (!trimDragging || !videoDuration) return;
		const frac = getTimelineFraction(event.clientX);
		const t = frac * videoDuration;
		if (trimDragging === 'start') {
			trimStart = clamp(t, 0, trimEnd - 0.1);
		} else {
			trimEnd = clamp(t, trimStart + 0.1, videoDuration);
		}
		if (videoEl) videoEl.currentTime = trimDragging === 'start' ? trimStart : trimEnd;
	}

	function onTimelineMouseUp() {
		trimDragging = null;
	}

	function onTimelineClick(event) {
		if (!videoDuration || trimDragging) return;
		const frac = getTimelineFraction(event.clientX);
		const t = frac * videoDuration;
		if (videoEl) videoEl.currentTime = t;
	}

	function formatTime(s) {
		const m = Math.floor(s / 60);
		const sec = (s % 60).toFixed(1).padStart(4, '0');
		return `${m}:${sec}`;
	}

	// ── WebCodecs video export ─────────────────────────────────────────

	async function exportVideo() {
		if (!workingFile || !isVideo) return;
		isExporting = true;
		exportProgress = 0;
		exportError = null;

		try {
			// Check WebCodecs support
			if (typeof VideoDecoder === 'undefined' || typeof VideoEncoder === 'undefined') {
				throw new Error('WebCodecs API is not supported in this browser. Please use Chrome or Edge.');
			}

			pushUndo(workingFile);

			const { naturalWidth, naturalHeight } = getMediaNaturalSize();
			const hasSpatialCrop = selection.width > 0 && selection.height > 0;
			const displayWidth = videoEl?.clientWidth || naturalWidth;
			const displayHeight = videoEl?.clientHeight || naturalHeight;

			// Compute crop rect in natural pixels
			let cropX = 0, cropY = 0, cropW = naturalWidth, cropH = naturalHeight;
			if (hasSpatialCrop) {
				const scaleX = naturalWidth / displayWidth;
				const scaleY = naturalHeight / displayHeight;
				cropX = Math.round(selection.x * scaleX);
				cropY = Math.round(selection.y * scaleY);
				cropW = Math.round(selection.width * scaleX);
				cropH = Math.round(selection.height * scaleY);
			}

			// Ensure even dimensions (VP8 requirement)
			cropW = cropW % 2 === 0 ? cropW : cropW - 1;
			cropH = cropH % 2 === 0 ? cropH : cropH - 1;

			const outputChunks = [];
			let encoderConfig = {
				codec: 'vp8',
				width: cropW,
				height: cropH,
				bitrate: 4_000_000,
				framerate: 30,
			};

			const encoder = new VideoEncoder({
				output: (chunk, meta) => {
					const buf = new Uint8Array(chunk.byteLength);
					chunk.copyTo(buf);
					outputChunks.push({ chunk, buf, meta });
				},
				error: (e) => { throw e; },
			});
			encoder.configure(encoderConfig);

			// Use canvas + requestVideoFrameCallback to grab frames
			const offscreen = new OffscreenCanvas(cropW, cropH);
			const ctx = offscreen.getContext('2d');

			const fps = 30;
			const frameDuration = 1 / fps;
			const totalFrames = Math.ceil((trimEnd - trimStart) * fps);
			let frameIndex = 0;

			// Seek-and-capture approach using seeked event
			const captureFrame = () => new Promise((resolve) => {
				const onSeeked = () => {
					videoEl.removeEventListener('seeked', onSeeked);
					resolve();
				};
				videoEl.addEventListener('seeked', onSeeked);
				videoEl.currentTime = trimStart + frameIndex * frameDuration;
			});

			for (frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
				await captureFrame();
				ctx.drawImage(videoEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
				const bitmap = await createImageBitmap(offscreen);
				const timestamp = Math.round(frameIndex * frameDuration * 1_000_000); // microseconds
				const frame = new VideoFrame(bitmap, { timestamp, duration: Math.round(frameDuration * 1_000_000) });
				encoder.encode(frame, { keyFrame: frameIndex % 30 === 0 });
				frame.close();
				bitmap.close();
				exportProgress = Math.round((frameIndex / totalFrames) * 90);
			}

			await encoder.flush();
			encoder.close();
			exportProgress = 95;

			// Mux into WebM using a minimal muxer
			const webmBlob = muxWebM(outputChunks, cropW, cropH, fps);
			exportProgress = 100;

			const outFile = new File([webmBlob], (workingFile.name || 'video').replace(/\.[^.]+$/, '') + '_edited.webm', { type: 'video/webm' });

			// Trigger download
			const a = document.createElement('a');
			a.href = URL.createObjectURL(outFile);
			a.download = outFile.name;
			a.click();
			setTimeout(() => URL.revokeObjectURL(a.href), 5000);

			activeTool = EDITTOOLS.NONE;
			selection = { x: 0, y: 0, width: 0, height: 0 };
		} catch (err) {
			console.error(err);
			exportError = err.message || 'Export failed';
		} finally {
			isExporting = false;
		}
	}

	/**
	 * Minimal WebM muxer — writes a valid WebM container with VP8 video.
	 * Supports single video track, no audio.
	 */
	function muxWebM(frames, width, height, fps) {
		// EBML helpers
		const enc = new TextEncoder();

		function encVint(val) {
			if (val < 0x80) return [val | 0x80];
			if (val < 0x4000) return [(val >> 8) | 0x40, val & 0xff];
			if (val < 0x200000) return [(val >> 16) | 0x20, (val >> 8) & 0xff, val & 0xff];
			if (val < 0x10000000) return [(val >> 24) | 0x10, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff];
			// unknown size marker
			return [0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
		}

		function encUint(val, bytes) {
			const arr = new Uint8Array(bytes);
			for (let i = bytes - 1; i >= 0; i--) { arr[i] = val & 0xff; val >>= 8; }
			return arr;
		}

		function el(id, ...children) {
			// id is Uint8Array, children are Uint8Array[]
			const body = concat(...children);
			return concat(id, new Uint8Array(encVint(body.length)), body);
		}

		function concat(...arrs) {
			const flat = arrs.flatMap(a => a instanceof Uint8Array ? [a] : a instanceof Array ? [new Uint8Array(a)] : [new Uint8Array([a])]);
			const len = flat.reduce((s, a) => s + a.length, 0);
			const out = new Uint8Array(len);
			let off = 0;
			for (const a of flat) { out.set(a, off); off += a.length; }
			return out;
		}

		// IDs
		const ID = {
			EBML: new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]),
			EBMLVersion: new Uint8Array([0x42, 0x86]),
			EBMLReadVersion: new Uint8Array([0x42, 0xf7]),
			EBMLMaxIDLength: new Uint8Array([0x42, 0xf2]),
			EBMLMaxSizeLength: new Uint8Array([0x42, 0xf3]),
			DocType: new Uint8Array([0x42, 0x82]),
			DocTypeVersion: new Uint8Array([0x42, 0x87]),
			DocTypeReadVersion: new Uint8Array([0x42, 0x85]),
			Segment: new Uint8Array([0x18, 0x53, 0x80, 0x67]),
			Info: new Uint8Array([0x15, 0x49, 0xa9, 0x66]),
			TimestampScale: new Uint8Array([0x2a, 0xd7, 0xb1]),
			MuxingApp: new Uint8Array([0x4d, 0x80]),
			WritingApp: new Uint8Array([0x57, 0x41]),
			Duration: new Uint8Array([0x44, 0x89]),
			Tracks: new Uint8Array([0x16, 0x54, 0xae, 0x6b]),
			TrackEntry: new Uint8Array([0xae]),
			TrackNumber: new Uint8Array([0xd7]),
			TrackUID: new Uint8Array([0x73, 0xc5]),
			TrackType: new Uint8Array([0x83]),
			CodecID: new Uint8Array([0x86]),
			Video: new Uint8Array([0xe0]),
			PixelWidth: new Uint8Array([0xb0]),
			PixelHeight: new Uint8Array([0xba]),
			Cluster: new Uint8Array([0x1f, 0x43, 0xb6, 0x75]),
			Timestamp: new Uint8Array([0xe7]),
			SimpleBlock: new Uint8Array([0xa3]),
		};

		function strEl(id, str) {
			const b = enc.encode(str);
			return concat(id, new Uint8Array(encVint(b.length)), b);
		}

		function uintEl(id, val, bytes = 1) {
			const b = encUint(val, bytes);
			return concat(id, new Uint8Array(encVint(b.length)), b);
		}

		function floatEl(id, val) {
			const buf = new ArrayBuffer(8);
			new DataView(buf).setFloat64(0, val, false);
			const b = new Uint8Array(buf);
			return concat(id, new Uint8Array(encVint(8)), b);
		}

		const timescaleMs = 1; // 1ms per tick
		const durationMs = frames.length > 0
			? Math.ceil((frames[frames.length - 1].chunk.timestamp + (1_000_000 / fps)) / 1000)
			: 0;

		const ebmlHeader = el(ID.EBML,
			uintEl(ID.EBMLVersion, 1),
			uintEl(ID.EBMLReadVersion, 1),
			uintEl(ID.EBMLMaxIDLength, 4),
			uintEl(ID.EBMLMaxSizeLength, 8),
			strEl(ID.DocType, 'webm'),
			uintEl(ID.DocTypeVersion, 2),
			uintEl(ID.DocTypeReadVersion, 2),
		);

		const info = el(ID.Info,
			uintEl(ID.TimestampScale, 1_000_000, 3), // 1ms in ns
			strEl(ID.MuxingApp, 'WebCodecs'),
			strEl(ID.WritingApp, 'ImageTools'),
			floatEl(ID.Duration, durationMs),
		);

		const video = el(ID.Video,
			uintEl(ID.PixelWidth, width, 2),
			uintEl(ID.PixelHeight, height, 2),
		);

		const trackEntry = el(ID.TrackEntry,
			uintEl(ID.TrackNumber, 1),
			uintEl(ID.TrackUID, 1, 4),
			uintEl(ID.TrackType, 1),
			strEl(ID.CodecID, 'V_VP8'),
			video,
		);

		const tracks = el(ID.Tracks, trackEntry);

		// Build clusters (group frames every ~1s)
		const clusterChunks = [];
		let clusterFrames = [];
		let clusterStartMs = 0;

		function flushCluster() {
			if (!clusterFrames.length) return;
			const blocks = clusterFrames.map(({ tsMs, buf, isKey }) => {
				const relTs = tsMs - clusterStartMs;
				// SimpleBlock: track number vint, 2-byte timecode, flags, data
				const header = new Uint8Array([
					0x81, // track 1 as vint
					(relTs >> 8) & 0xff,
					relTs & 0xff,
					isKey ? 0x80 : 0x00,
				]);
				return concat(
					ID.SimpleBlock,
					new Uint8Array(encVint(header.length + buf.length)),
					header,
					buf,
				);
			});
			const clusterBody = concat(
				uintEl(ID.Timestamp, clusterStartMs, 4),
				...blocks,
			);
			clusterChunks.push(concat(ID.Cluster, new Uint8Array(encVint(clusterBody.length)), clusterBody));
			clusterFrames = [];
		}

		for (const { chunk, buf } of frames) {
			const tsMs = Math.round(chunk.timestamp / 1000);
			if (!clusterFrames.length) clusterStartMs = tsMs;
			if (tsMs - clusterStartMs > 1000 && chunk.type === 'key') {
				flushCluster();
				clusterStartMs = tsMs;
			}
			clusterFrames.push({ tsMs, buf, isKey: chunk.type === 'key' });
		}
		flushCluster();

		const segmentBody = concat(info, tracks, ...clusterChunks);
		const segment = concat(ID.Segment, new Uint8Array(encVint(segmentBody.length)), segmentBody);

		return new Blob([ebmlHeader, segment], { type: 'video/webm' });
	}
</script>

<svelte:window
	on:mousemove={(e) => { onTimelineMouseMove(e); updateSelection(e); }}
	on:mouseup={(e) => { onTimelineMouseUp(); endSelection(); }}
/>

<DragDropZone
	onFileSelected={handleFileSelected}
	message="Drop image or video to load"
	class_="rounded-3xl p-4"
>

<div class="roundedxl bg-stone-950/40 w-full aspect-square md:aspect-video border border-white/10 text-gray-300">
	{#if workingFile}
		<!-- Media container -->
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div
			bind:this={containerEl}
			class="relative w-full flex items-center justify-center overflow-hidden"
			style="height: {activeTool === EDITTOOLS.TRIM ? 'calc(100% - 72px)' : '100%'}"
			role="application"
			on:mousedown|preventDefault={startSelection}
		>
			{#if isVideo}
				<video
					bind:this={videoEl}
					src={imageUrl}
					class="border border-black"
					style={imgStyle}
					on:timeupdate={() => { currentTime = videoEl?.currentTime || 0; }}
					muted
					playsinline
					preload="auto"
				></video>
			{:else}
				<img
					bind:this={imageEl}
					src={imageUrl}
					alt=""
					class="border border-black"
					class:checkerboard={showCheckerboard}
					style={imgStyle}
				/>
			{/if}

			{#if selection.width > 0 && selection.height > 0 && (activeTool === EDITTOOLS.CROP || isVideo)}
				{@const x = imageOffset.x + selection.x}
				{@const y = imageOffset.y + selection.y}
				{@const r = imageOffset.x + selection.x + selection.width}
				{@const b = imageOffset.y + selection.y + selection.height}
				<!-- top -->
				<div class="absolute inset-x-0 top-0 bg-black/40 pointer-events-none" style="height: {y}px"></div>
				<!-- bottom -->
				<div class="absolute inset-x-0 bottom-0 bg-black/40 pointer-events-none" style="top: {b}px"></div>
				<!-- left -->
				<div class="absolute left-0 bg-black/40 pointer-events-none" style="top: {y}px; width: {x}px; height: {selection.height}px"></div>
				<!-- right -->
				<div class="absolute right-0 bg-black/40 pointer-events-none" style="top: {y}px; left: {r}px; height: {selection.height}px"></div>
				<!-- border -->
				<div
					class="absolute border-2 pointer-events-none border-white/60"
					style="left: {x}px; top: {y}px; width: {selection.width}px; height: {selection.height}px;"
				></div>
			{/if}

			<!-- Corner buttons -->
			<div class="absolute opacity-50 hover:opacity-100 top-0 right-0 p-4 flex flex-col items-end gap-2">
				<button
					on:click={closeImage}
					class="rounded-xl bg-stone-800 p-2 text-sm hover:bg-slate-700 border-2 border-white/10 aspect-square"
					aria-label="Close image"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true">
						<line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" />
						<line x1="6" y1="18" x2="18" y2="6" stroke-linecap="round" />
					</svg>
				</button>

				<button
					on:click={undo}
					class="rounded-xl bg-stone-800 p-2 text-sm hover:bg-slate-700 border-2 border-white/10 aspect-square"
					aria-label="Undo"
					disabled={undoStack.length === 0}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
						<path d="M6 10 A6 6 0 1 1 7.5 15" stroke-linecap="round" stroke-linejoin="round" />
						<polyline points="3 7 6 10 9 7" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>

				{#if !isVideo}
					<button
						on:click={() => (showCheckerboard = !showCheckerboard)}
						aria-label="Toggle checkerboard"
						class="rounded-xl bg-stone-800 p-2 text-sm hover:bg-slate-700 border-2 border-white/10 aspect-square"
						class:highlight={showCheckerboard}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<rect x="3" y="3" width="8" height="8" fill="currentColor" opacity="0.75" />
							<rect x="13" y="3" width="8" height="8" fill="currentColor" opacity="0.25" />
							<rect x="3" y="13" width="8" height="8" fill="currentColor" opacity="0.25" />
							<rect x="13" y="13" width="8" height="8" fill="currentColor" opacity="0.75" />
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<!-- Trim timeline -->
		{#if activeTool === EDITTOOLS.TRIM && isVideo && videoDuration > 0}
			<div class="px-4 pb-2 pt-1 flex flex-col gap-1 select-none">
				<!-- Timeline track -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					bind:this={timelineEl}
					class="relative h-8 bg-stone-800 rounded-lg cursor-pointer overflow-visible"
					on:click={onTimelineClick}
				>
					<!-- Dimmed regions outside trim -->
					<div
						class="absolute top-0 h-full bg-black/50 rounded-l-lg pointer-events-none"
						style="left: 0; width: {(trimStart / videoDuration) * 100}%"
					></div>
					<div
						class="absolute top-0 h-full bg-black/50 rounded-r-lg pointer-events-none"
						style="left: {(trimEnd / videoDuration) * 100}%; right: 0"
					></div>

					<!-- Active trim region border -->
					<div
						class="absolute top-0 h-full border-y-2 border-cyan-400 pointer-events-none"
						style="left: {(trimStart / videoDuration) * 100}%; width: {((trimEnd - trimStart) / videoDuration) * 100}%"
					></div>

					<!-- Playhead -->
					<div
						class="absolute top-0 h-full w-0.5 bg-white pointer-events-none"
						style="left: {(currentTime / videoDuration) * 100}%"
					></div>

					<!-- Start handle -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="absolute top-0 h-full w-3 bg-cyan-400 rounded-l cursor-ew-resize flex items-center justify-center"
						style="left: calc({(trimStart / videoDuration) * 100}% - 6px)"
						on:mousedown={(e) => { e.stopPropagation(); onTimelineMouseDown(e, 'start'); }}
					>
						<div class="w-0.5 h-3 bg-cyan-900 rounded"></div>
					</div>

					<!-- End handle -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="absolute top-0 h-full w-3 bg-cyan-400 rounded-r cursor-ew-resize flex items-center justify-center"
						style="left: calc({(trimEnd / videoDuration) * 100}% - 6px)"
						on:mousedown={(e) => { e.stopPropagation(); onTimelineMouseDown(e, 'end'); }}
					>
						<div class="w-0.5 h-3 bg-cyan-900 rounded"></div>
					</div>
				</div>

				<!-- Time labels -->
				<div class="flex justify-between text-xs text-stone-400 font-mono px-1">
					<span>{formatTime(trimStart)}</span>
					<span class="text-stone-500">{formatTime(currentTime)}</span>
					<span>{formatTime(trimEnd)}</span>
				</div>
			</div>
		{/if}

	{:else}
		<input
			bind:this={fileInput}
			type="file"
			accept="image/*,video/*"
			class="hidden"
			on:change={onFileChange}
		/>
		<button
			on:click={openFilePicker}
			class="flex flex-col w-full h-full items-center justify-center gap-2 text-gray-300"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v12" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M8 7l4-4 4 4" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2" />
			</svg>
			Drop image or video here, or click to select
		</button>
	{/if}
</div>

<!-- Toolbar -->
<div
	id="edit-tools"
	class="mt-3 flex flex-wrap justify-center gap-2"
	class:disabled={!workingFile}
	inert={!workingFile}
>
	{#if activeTool === EDITTOOLS.NONE}
		<!-- Crop button (image and video) -->
		<button
			on:click={() => (activeTool = EDITTOOLS.CROP)}
			class="rounded-xl bg-stone-800 px-4 py-2 text-sm hover:bg-slate-700"
			aria-label="Crop"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path d="M4 10V4h8" stroke-linecap="round" />
				<path d="M20 14v6h-6" stroke-linecap="round" />
			</svg>
		</button>

		<!-- Trim button (video only) -->
		{#if isVideo}
			<button
				on:click={() => (activeTool = EDITTOOLS.TRIM)}
				class="rounded-xl bg-stone-800 px-4 py-2 text-sm hover:bg-slate-700 flex items-center gap-2"
				aria-label="Trim"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<line x1="4" y1="12" x2="20" y2="12" stroke-linecap="round" />
					<line x1="8" y1="6" x2="8" y2="18" stroke-linecap="round" />
					<line x1="16" y1="6" x2="16" y2="18" stroke-linecap="round" />
				</svg>
			</button>
		{/if}

	{:else if activeTool === EDITTOOLS.CROP}
		{#if isVideo}
			<!-- For video, crop is applied at export time -->
			<button
				on:click={() => { activeTool = EDITTOOLS.NONE; }}
				disabled={selection.width === 0 || selection.height === 0}
				class="rounded-xl bg-cyan-700 px-4 py-2 text-sm hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Set Crop
			</button>
		{:else}
			<button
				on:click={cropImage}
				disabled={selection.width === 0 || selection.height === 0}
				class="rounded-xl bg-cyan-700 px-4 py-2 text-sm hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Done
			</button>
		{/if}

	{:else if activeTool === EDITTOOLS.TRIM}
		<button
			on:click={() => { activeTool = EDITTOOLS.NONE; }}
			class="rounded-xl bg-cyan-700 px-4 py-2 text-sm hover:bg-cyan-600"
		>
			Set Trim
		</button>
	{/if}

	{#if activeTool !== EDITTOOLS.NONE}
		<button
			on:click={() => {
				activeTool = EDITTOOLS.NONE;
				selection = { x: 0, y: 0, width: 0, height: 0 };
			}}
			class="rounded-xl bg-stone-800 px-4 py-2 text-sm hover:bg-slate-700"
		>
			Cancel
		</button>
	{/if}

	<!-- Export button for video (applies both trim and spatial crop) -->
	{#if isVideo && activeTool === EDITTOOLS.NONE}
		<button
			on:click={exportVideo}
			disabled={isExporting}
			class="rounded-xl bg-emerald-700 px-4 py-2 text-sm hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
		>
			{#if isExporting}
				<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 3a9 9 0 1 0 9 9" stroke-linecap="round"/>
				</svg>
				{exportProgress}%
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 3v12" stroke-linecap="round"/>
					<path d="M8 11l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2" stroke-linecap="round"/>
				</svg>
				Export WebM
			{/if}
		</button>
	{/if}
</div>

{#if exportError}
	<p class="mt-2 text-center text-xs text-red-400">{exportError}</p>
{/if}

</DragDropZone>
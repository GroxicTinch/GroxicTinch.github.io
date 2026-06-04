import { writable } from 'svelte/store';

/**
 * File and drag-drop utilities for handling image uploads
 */

export function fileToDataURL(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => {
			reader.abort();
			reject(new Error('Failed to read file'));
		};
		reader.onload = () => resolve(reader.result);
		reader.readAsDataURL(file);
	});
}

export async function urlImageToDataURL(url) {
	const res = await fetch(url, { mode: 'cors' });
	if (!res.ok) throw new Error('Failed to fetch image');
	const blob = await res.blob();
	return await fileToDataURL(blob);
}

/**
 * Creates drag-drop handlers for file upload
 * Returns an object with: isDragging (writable), handlers (dragenter, dragover, dragleave, drop)
 *
 * @param {function} onFileSelected - Callback function that receives the dropped/selected file
 * @returns {object} { isDragging, dragCounter, onDragEnter, onDragOver, onDragLeave, onDrop }
 */
export function createDragDropHandlers(onFileSelected) {
  const isDragging = writable(false);
	let dragCounter = 0;

	function onDragEnter(e) {
		e.preventDefault();
		dragCounter++;
		if (dragCounter === 1) isDragging.set(true);
		try {
			e.dataTransfer.dropEffect = 'copy';
		} catch {}
		return isDragging;
	}

	function onDragOver(e) {
		e.preventDefault();
		try {
			e.dataTransfer.dropEffect = 'copy';
		} catch {}
  }

	function onDragLeave(e) {
		e.preventDefault();
		dragCounter = Math.max(0, dragCounter - 1);
		if (dragCounter === 0) isDragging.set(false);
    return isDragging;
	}

	function onDrop(e) {
		e.preventDefault();
		dragCounter = 0;
		isDragging.set(false);
		const files = e.dataTransfer.files;
		if (files?.[0]) {
			onFileSelected(files[0]);
		}
    return isDragging;
	}

  return { isDragging, onDragEnter, onDragOver, onDragLeave, onDrop };
}

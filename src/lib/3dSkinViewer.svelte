<script>
  import { onMount, onDestroy } from 'svelte';
  import { SkinViewer, WalkingAnimation } from 'skinview3d';

  export let src = 'imgs/defaultMinecraftSkin.png';
  export let cape = null; // url or null
  export let width = 300;
  export let height = 400;
  export let background = null; // number (0xRRGGBB) or null
  export let backgroundImage = null; // url for loadBackground
  export let panorama = null; // url for loadPanorama
  export let fov = 50;
  export let zoom = 0.98;
  export let autoRotate = false;
  export let animation = new WalkingAnimation(); // e.g. new WalkingAnimation()
  export let animationSpeed = 0.2;
  export let animationPaused = false;

  let canvasEl;
  let viewer;

  onMount(() => {
    viewer = new SkinViewer({ canvas: canvasEl, width, height, skin: src });

    const ro = new ResizeObserver(() => {
      const el = canvasEl;            // capture current ref
      if (!el) return;               // <--- guard
      const r = el.getBoundingClientRect();
      viewer.width = Math.round(r.width);
      viewer.height = Math.round(r.height);
      viewer.setSize(viewer.width, viewer.height);
    });

    if (canvasEl) ro.observe(canvasEl);

    onDestroy(() => {
      ro.disconnect();
      viewer?.destroy();
      viewer = null;
    });
  });

  // reactive updates for props
  $: if (viewer) {
    if (src) viewer.loadSkin(src);
    if (cape !== undefined) viewer.loadCape(cape);
    if (background !== null) viewer.background = background;
    if (backgroundImage) viewer.loadBackground(backgroundImage);
    if (panorama) viewer.loadPanorama(panorama);
    if (fov !== undefined) viewer.fov = fov;
    if (zoom !== undefined) viewer.zoom = zoom;
    if (autoRotate !== undefined) viewer.autoRotate = autoRotate;

    if (animation !== undefined) {
      viewer.animation = animation;
      if (viewer.animation) {
        viewer.animation.speed = animationSpeed ?? viewer.animation.speed;
        viewer.animation.paused = animationPaused ?? viewer.animation.paused;
      }
    }
  }

  // Expose a few helper functions via instance methods if parent uses bind:this
  export function loadSkin(url) { viewer?.loadSkin(url); }
  export function loadCape(url, options) { viewer?.loadCape(url, options); }
  export function loadBackground(url) { viewer?.loadBackground(url); }
  export function loadPanorama(url) { viewer?.loadPanorama(url); }
  export function setSize(w, h) { if (viewer) { viewer.setSize(w, h); viewer.width = w; viewer.height = h; } }
  export function destroy() { viewer?.destroy(); viewer = null; }
</script>

<canvas bind:this={canvasEl} style="display:block; width:100%; height:100%"></canvas>

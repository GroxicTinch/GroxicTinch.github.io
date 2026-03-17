<script>
  import { tagConfig } from './tagConfig.js';

  let { title = "", items = [] } = $props();
</script>

<article class="p-5 rounded-lg bg-white/5">
  <h2 class="text-center mt-0">{title}</h2>

  <ul class="mt-auto flex flex-wrap gap-2 mt-4">
    {#each items as item}
      <li class="px-2 py-1 text-xs rounded bg-white/10 text-gray-100">
        {item}
      </li>
    {/each}
  </ul>
</article>

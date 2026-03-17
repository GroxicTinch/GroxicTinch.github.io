<script>
  import { tagConfig } from './tagConfig.js';

  let {
    href = '#',
    title = '',
    description = '',
    image = '',
    imageAlt = '',
    target = '_self',
    banner = '',
    bannerFg = 'text-gray-800',
    bannerBg = 'bg-gray-300',
    tags = []
  } = $props();
</script>

<article class="relative max-w-sm 2xl:max-w-lg bg-white/5 backdrop-blur rounded-xl overflow-hidden hover:scale-105 transition-transform duration-150">
  {#if banner.length > 0}
    <div class="absolute top-10 -right-16 w-1/2 rotate-45 {bannerBg || 'bg-gray-300'} {bannerFg || 'text-gray-800'} text-xl font-bold text-center py-1 pointer-events-none shadow-lg shadow-black/50 z-10">
      {banner}
    </div>
  {/if}

  <a
    href={href}
    target={target}
    rel={target === '_blank' ? 'noopener noreferrer' : undefined}
    class="flex flex-col size-full {href === '#' ? 'cursor-not-allowed' : 'cursor-pointer'} {href === '#' ? 'opacity-50 hover:opacity-100' : ''}"
  >
    {#if image}
      <img src={image} alt={imageAlt} class="flex justify-center items-center w-full h-48 object-cover" />
    {/if}

    <div class="p-4 flex flex-col h-full">
      <div>
        <h3 class="text-lg font-semibold">{title}</h3>

        {#if description}
          <p class="mt-2 mb-3 text-sm text-gray-300">{description}</p>
        {/if}
      </div>

      {#if tags.length > 0}
        <div class="mt-auto flex flex-wrap gap-2">
          {#each tags as tag}
            <span
              class="px-2 py-1 text-xs rounded {tagConfig[tag]?.bg || 'bg-white/10'} {tagConfig[tag]?.text || 'text-gray-200'}"
            >
              {tag}
            </span>
          {/each}
        </div>
      {/if}
    </div>
  </a>
</article>

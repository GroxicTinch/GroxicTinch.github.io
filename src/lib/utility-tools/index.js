const modules = import.meta.glob('./*.svelte', { eager: true });

export const utilityTools = Object.entries(modules)
	.map(([path, mod]) => {
		const id = path.match(/\.\/([^.]+)\.svelte$/)[1];
		return {
			id,
			title: mod.title || id.replace(/([A-Z])/g, ' $1').trim(),
			description: mod.description || '',
			largeCard: !!mod.largeCard,
			component: mod.default
		};
	})
	.sort((a, b) => a.title.localeCompare(b.title));

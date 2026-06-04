const modules = import.meta.glob('./*.svelte', { eager: true });

export const utilityTools = Object.entries(modules)
	.map(([path, mod]) => {
		const id = path.match(/\.\/([^.]+)\.svelte$/)[1];
		return {
			id,
			title: mod.title || id.replace(/([A-Z])/g, ' $1').trim(),
			description: mod.description || '',
			rows: mod.size?.rows || 1,
			cols: mod.size?.cols || 1,
			sortPriority: mod.sortPriority || 0, // Higher means it appears first
			component: mod.default
		};
	})
	.sort((a, b) => {
		if (a.sortPriority !== b.sortPriority) {
			return b.sortPriority - a.sortPriority;
		}
		return a.title.localeCompare(b.title);
	}
);

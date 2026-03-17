// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter(),
		// If deploying to a subdirectory (e.g. username.github.io/repo-name):
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/your-repo-name' : ''
		}
	}
};
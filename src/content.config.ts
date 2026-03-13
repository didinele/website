import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

export const collections = {
	blog: defineCollection({
		loader: glob({
			base: './src/content/blog',
			pattern: '**/*.{md,mdx}',
		}),
		schema: z.object({
			title: z.string(),
			publishDate: z
				.string()
				.transform((str) => new Date(str))
				.or(z.date()),
			tags: z
				.string()
				.transform((str) => str.split(','))
				.pipe(z.array(z.string())),
		}),
	}),
};

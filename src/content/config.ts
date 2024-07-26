import { defineCollection, z } from 'astro:content';

export const collections = {
	blog: defineCollection({
		schema: z.object({
			title: z.string(),
			publishDate: z
				.string()
				.transform((str) => new Date(str))
				.or(z.date()),
		}),
	}),
};

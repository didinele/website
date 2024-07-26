import type { CollectionEntry } from 'astro:content';
import { useAtom } from 'solid-jotai';
import { selectedBlogTagAtom } from '../atoms/atoms.tsx';
import Preview from './Preview.tsx';

export default function PostList({ posts }: { readonly posts: CollectionEntry<'blog'>[] }) {
	const [selectedTag] = useAtom(selectedBlogTagAtom);

	return (
		<div class="flex flex-col gap-2">
			{posts
				.filter((post) => {
					const tag = selectedTag();
					return !tag || post.data.tags.includes(tag);
				})
				.map((entry) => (
					<Preview path={`/blog/${entry.slug}`} title={entry.data.title} tags={entry.data.tags} />
				))}
		</div>
	);
}

import clsx from 'clsx';
import { DateTime } from 'luxon';
import { useAtom } from 'solid-jotai';
import { Show } from 'solid-js';
import { selectedBlogTagAtom } from '../atoms/atoms.tsx';
import Pill from './Pill.tsx';

interface Props {
	readonly path: string;
	readonly publishDate: Date;
	readonly tags: string[];
	readonly thumbnailUrl?: string;
	readonly title: string;
}

export default function Preview(props: Props) {
	const [selectedTag, setSelectedTag] = useAtom(selectedBlogTagAtom);

	const linkClasses = clsx(
		'flex',
		'flex-col',
		'p-4',
		'rounded-lg',
		'border-2',
		'border-zinc-300/50',
		'dark:border-zinc-700/50',
		'hover:boder-zinc-300/75',
		'dark:hover:border-zinc-700/75',
		'bg-zinc-100/50',
		'dark:bg-zinc-900/50',
		'hover:bg-zinc-100/75',
		'dark:hover:bg-zinc-900/75',
	);

	return (
		<div class={linkClasses}>
			<Show when={props.thumbnailUrl}>
				<img src={props.thumbnailUrl} />
			</Show>

			<h2 class="text-2xl font-bold">
				<a href={props.path}>{props.title}</a>
			</h2>

			<div class="flex flex-col">
				<h3 class="text-zinc-500">{DateTime.fromJSDate(props.publishDate).toLocaleString()}</h3>
				<Show when={props.tags.length}>
					<div class="flex flex-row flex-wrap gap-2 pt-2">
						{props.tags.map((tag) => (
							<Pill
								onClick={() => {
									setSelectedTag(selectedTag() === tag ? undefined : tag);
								}}
								class={tag === selectedTag() ? 'bg-sky-500' : ''}
								isActive={tag === selectedTag()}
							>
								<p>{tag}</p>
							</Pill>
						))}
					</div>
				</Show>
			</div>
		</div>
	);
}

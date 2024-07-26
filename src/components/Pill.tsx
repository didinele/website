import clsx from 'clsx';
import { type JSX, type ParentProps, splitProps, Show } from 'solid-js';

export type StatusPillProps = JSX.HTMLAttributes<HTMLButtonElement> & {
	isActive?: boolean;
	progress?: number;
};

export default function Pill(props: ParentProps<StatusPillProps>) {
	const [inner, container] = splitProps(props, ['progress', 'children']);

	const computeClasses = () =>
		clsx(
			container.class,
			'py-2',
			'px-4',
			'rounded-full',
			props.isActive ? '' : 'text-zinc-600',
			props.isActive ? '' : 'dark:text-zinc-400',
			props.isActive ? '' : 'bg-zinc-300/50',
			props.isActive ? '' : 'hover:bg-zinc-300',
			props.isActive ? '' : 'dark:hover:bg-zinc-700',
			props.isActive ? '' : 'dark:bg-zinc-700/50',
			'max-w-xs',
			'relative',
			'transition-all',
			'cursor-pointer',
		);

	return (
		<button {...container} class={computeClasses()}>
			<span class="flex gap-2 items-center z-10 relative font-medium">{inner.children}</span>
			<Show when={inner.progress}>
				<span class="absolute inset-0 rounded-full overflow-hidden">
					<span
						class="absolute top-0 bottom-0 left-0 bg-zinc-400/25"
						style={{ width: `${(inner.progress ?? 0) * 100}%` }}
					/>
				</span>
			</Show>
		</button>
	);
}

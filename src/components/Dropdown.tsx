/* eslint-disable react/prop-types */

import Dismiss from 'solid-dismiss';
import { createMemo, createSignal, mergeProps, type ParentProps, Show, For } from 'solid-js';
import FloatingCard from './FloatingCard';

export interface Props {
	collapseSingle?: boolean;
	links: Record<string, string>;
}

export default function Dropdown(parentProps: ParentProps<Props>) {
	const props = mergeProps({ collapseSingle: true }, parentProps);

	const [isOpen, setOpen] = createSignal(false);
	const [ref, setRef] = createSignal<HTMLElement>();
	const firstLink = createMemo(() => Object.keys(props.links)[0]);
	const firstName = createMemo(() => Object.values(props.links)[0]);
	const hasManyLinks = createMemo(() => !props.collapseSingle || Object.keys(props.links).length > 1);

	return (
		<div class="inline-block relative">
			<div class="transition-colors hover:bg-zinc-300 rounded px-1 cursor-pointer">
				<Show
					when={hasManyLinks()}
					fallback={
						<a href={firstLink()} rel="prefetch">
							{firstName()}
						</a>
					}
				>
					<button ref={setRef} class="flex gap-2 items-center">
						<Show when={props.children}>
							<div>{props.children}</div>
						</Show>
						<div
							classList={{
								'i-bi-chevron-up': isOpen(),
								'i-bi-chevron-down': !isOpen(),
							}}
						/>
					</button>
				</Show>
			</div>
			<Dismiss menuButton={ref} open={isOpen} setOpen={setOpen}>
				<FloatingCard menuButton={ref}>
					<ul class="min-w-24">
						<For each={Object.entries(props.links)}>
							{([url, name]) => (
								<a class="block transition-colors hover:bg-zinc-200 rounded px-1" href={url} rel="prefetch">
									{name}
								</a>
							)}
						</For>
					</ul>
				</FloatingCard>
			</Dismiss>
		</div>
	);
}

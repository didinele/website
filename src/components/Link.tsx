import type { ParentProps } from 'solid-js';

export interface LinkProps {
	href: string;
}

export default function Link(props: ParentProps<LinkProps>) {
	return (
		<a
			href={props.href}
			rel="prefetch"
			class="transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded px-1 cursor-pointer"
		>
			{props.children}
		</a>
	);
}

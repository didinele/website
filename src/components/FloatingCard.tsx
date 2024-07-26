import { autoUpdate, flip, offset, type ReferenceElement, shift } from '@floating-ui/dom';
import clsx from 'clsx';
import { createSignal, type JSX, type ParentProps, splitProps } from 'solid-js';
import { useFloating } from '../util/floating-ui';

export type Props<Ref extends ReferenceElement> = JSX.HTMLAttributes<HTMLDivElement> & {
	menuButton(): Ref | null | undefined;
};

export default function FloatingCard<Ref extends ReferenceElement>(props: ParentProps<Props<Ref>>) {
	const [inner, container] = splitProps(props, ['children', 'menuButton']);

	const [floating, setFloating] = createSignal<HTMLDivElement>();
	const position = useFloating(inner.menuButton, floating, {
		whileElementsMounted: autoUpdate,
		middleware: [flip(), shift(), offset(10)],
		placement: 'bottom',
	});

	return (
		<div
			{...container}
			ref={setFloating}
			class={clsx('z-20', container.class)}
			style={{
				position: position.strategy,
				left: `${position.x ?? 0}px`,
				top: `${position.y ?? 0}px`,
			}}
		>
			<div class="bg-white dark:bg-black p-3 rounded shadow flex flex-co min-w-0 w-max max-w-96 gap-3">
				{inner.children}
			</div>
		</div>
	);
}

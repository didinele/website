import Dismiss from 'solid-dismiss';
import { lazy, type Accessor, type ParentProps, Suspense, createSignal } from 'solid-js';

const FloatingCard = lazy(async () => import('./FloatingCard'));

export interface DismissibleCardProps {
	ref: Accessor<HTMLElement | undefined>;
}

export default function DismissibleCard(props: ParentProps<DismissibleCardProps>) {
	const [visible, setVisible] = createSignal(false);
	return (
		<Dismiss menuButton={props.ref} open={visible} setOpen={setVisible}>
			<Suspense>
				<FloatingCard menuButton={props.ref}>{props.children}</FloatingCard>
			</Suspense>
		</Dismiss>
	);
}

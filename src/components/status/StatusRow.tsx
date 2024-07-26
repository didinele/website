import { Index, type JSX } from 'solid-js';
import useLanyard, { type Presence } from '../../hooks/useLanyard';
import { CONSTANTS } from '../../util/constants';
import ActivityPill from './ActivityPill';
import CurrentTime from './CurrentTime';
import StatusPill from './StatusPill';

export default function StatusRow(props: { readonly initialPresence: Presence | null }): JSX.Element {
	const presence = useLanyard(CONSTANTS.DISCORD_USER_ID, props.initialPresence);

	const customStatus = () => presence?.activities?.find((a) => a.type === 4);
	const activities = () => presence?.activities?.filter((a) => a.type === 0) ?? [];

	return (
		<div class="flex gap-2 flex-wrap">
			<CurrentTime />
			<StatusPill
				customStatus={customStatus()}
				status={presence?.discord_status ?? 'online'}
				user={presence?.discord_user ?? null}
			/>
			<Index each={activities()}>{(item) => <ActivityPill activity={item()} />}</Index>
		</div>
	);
}

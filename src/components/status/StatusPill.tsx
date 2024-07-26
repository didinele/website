import type { GatewayActivity } from 'discord-api-types/v10';
import { createSignal, Match, Switch } from 'solid-js';
import type { DiscordUser } from '../../hooks/useLanyard';
import { CONSTANTS } from '../../util/constants.tsx';
import DismissibleCard from '../DismissibleCard';
import Pill from '../Pill.tsx';

export interface StatusPillProps {
	// eslint-disable-next-line react/no-unused-prop-types
	readonly customStatus?: GatewayActivity;
	readonly status: string;
	readonly user: DiscordUser | null;
}

export default function StatusPill(props: StatusPillProps) {
	const [pill, setPill] = createSignal<HTMLDivElement>();

	return (
		<div class="relative">
			<Pill ref={setPill}>
				<Switch>
					<Match when={props.status === 'online'}>
						<span class="i-mdi-circle text-2xl text-green-500" />
					</Match>
					<Match when={props.status === 'idle'}>
						<span class="i-mdi-moon-waxing-crescent text-2xl text-yellow-500" />
					</Match>
					<Match when={props.status === 'dnd'}>
						<span class="i-mdi-minus-circle text-2xl text-red-500" />
					</Match>
					<Match when={props.status === 'offline'}>
						<span class="i-mdi-record-circle text-2xl" />
					</Match>
				</Switch>
				<p class="w-full truncate">{props.status}</p>
			</Pill>
			<DismissibleCard ref={pill}>
				<div>
					<img
						class="rounded-full w-6 h-6 inline-block mr-2"
						src={props.user ? CONSTANTS.DISCORD_AVATAR_URL(props.user?.avatar, 32) : undefined}
					/>
					<div class="inline-block">
						<span>{props.user?.username ?? 'didinele'}</span>
					</div>
				</div>
			</DismissibleCard>
		</div>
	);
}

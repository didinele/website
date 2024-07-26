import type { GatewayActivity } from 'discord-api-types/v10';
import { createSignal, Show } from 'solid-js';
import DismissibleCard from '../DismissibleCard';
import GameCard from './GameCard';
import Pill from './Pill';

function makeAssetUrl(appId: string, assetId: string): string {
	return `https://cdn.discordapp.com/app-assets/${appId}/${assetId}.png`;
}

export interface ActivityPillProps {
	readonly activity: GatewayActivity;
}

export default function ActivityPill(props: ActivityPillProps) {
	const [pill, setPill] = createSignal<HTMLDivElement>();

	return (
		<div class="relative">
			<Pill ref={setPill}>
				<Show when={props.activity.application_id && props.activity.assets?.small_image}>
					<img
						class="h-6 w-6 rounded-full"
						src={makeAssetUrl(props.activity.application_id!, props.activity.assets!.small_image!)}
					/>
				</Show>
				<p class="w-full truncate">{props.activity.name}</p>
			</Pill>
			<DismissibleCard ref={pill}>
				<GameCard activity={props.activity} />
			</DismissibleCard>
		</div>
	);
}

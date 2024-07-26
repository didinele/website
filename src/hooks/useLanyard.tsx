import type { GatewayActivity } from 'discord-api-types/v10';
import { onCleanup } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { isServer } from 'solid-js/web';

export interface Timestamps {
	end: number;
	start: number;
}

export interface Presence {
	active_on_discord_desktop: boolean;
	active_on_discord_mobile: boolean;
	activities: GatewayActivity[];
	discord_status: string;
	discord_user: DiscordUser;
	kv: Record<string, string>;
}

export interface DiscordUser {
	avatar: string;
	discriminator: string;
	id: string;
	public_flags: number;
	username: string;
}

enum OpCode {
	Event,
	Hello,
	Initialize,
	Heartbeat,
}

interface BasePacket<Code extends OpCode, Data = unknown> {
	d: Data;
	op: Code;
}

type Packet<Code extends OpCode, Data = unknown> = BasePacket<Code, Data> & {
	seq: number;
};

type EventPacket<Type extends string | undefined = string, Data = unknown> = Packet<OpCode.Event, Data> & {
	t: Type;
};

type InitializePacket = BasePacket<OpCode.Initialize, { subscribe_to_ids: string[] }>;
type HelloPacket = Packet<OpCode.Hello, { heartbeat_interval: number }>;
type InitStatePacket = EventPacket<'INIT_STATE', Record<string, Presence>>;
type PresenceUpdatePacket = EventPacket<'PRESENCE_UPDATE', Presence>;

type IncomingPacket = HelloPacket | InitStatePacket | PresenceUpdatePacket;

export default function useLanyard(userId: string, initialPresence: Presence | null) {
	if (!initialPresence) {
		return null;
	}

	const [data, setData] = createStore(initialPresence);

	let cleanup = new AbortController();
	let socket: WebSocket | undefined;
	let heartbeatInterval: NodeJS.Timeout | null = null;

	function handleEvent(message: InitStatePacket | PresenceUpdatePacket) {
		switch (message.t) {
			case 'INIT_STATE':
				setData(Object.values(message.d)[0]);
				break;
			case 'PRESENCE_UPDATE':
				setData(reconcile(message.d, { merge: true }));
				break;
		}
	}

	function connect() {
		cleanup = new AbortController();
		socket = new WebSocket('wss://api.lanyard.rest/socket');

		socket.addEventListener(
			'message',
			(event) => {
				const message: IncomingPacket = JSON.parse(event.data);
				switch (message.op) {
					case OpCode.Hello:
						if (heartbeatInterval) {
							clearInterval(heartbeatInterval);
						}

						heartbeatInterval = setInterval(() => socket?.send('{"op":3}'), message.d.heartbeat_interval);
						break;
					case OpCode.Event: {
						handleEvent(message);

						break;
					}
				}
			},
			{ signal: cleanup.signal },
		);

		socket.addEventListener(
			'open',
			() => {
				const packet: InitializePacket = {
					op: 2,
					// eslint-disable-next-line id-length
					d: {
						subscribe_to_ids: [userId],
					},
				};

				socket?.send(JSON.stringify(packet));
			},
			{ signal: cleanup.signal },
		);

		socket.addEventListener(
			'close',
			() => {
				cleanup.abort();
				connect();
			},
			{ signal: cleanup.signal },
		);
	}

	onCleanup(() => {
		socket?.close();
		cleanup.abort();
		if (heartbeatInterval) clearInterval(heartbeatInterval);
	});

	if (!isServer) {
		connect();
	}

	return data;
}

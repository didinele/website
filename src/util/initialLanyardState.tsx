import type { Presence } from '../hooks/useLanyard.tsx';
import { CONSTANTS } from './constants.tsx';

interface RestResponse {
	data: Presence;
	success: boolean;
}

export async function getInitialLanyardState() {
	const res = await fetch(`https://api.lanyard.rest/v1/users/${CONSTANTS.DISCORD_USER_ID}`);
	if (!res.ok) {
		throw new Error(await res.text());
	}

	const body: RestResponse = await res.json();
	if (!body.success) {
		throw new Error('Lanyard broke');
	}

	return body.data;
}

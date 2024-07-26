export const CONSTANTS = {
	DISCORD_USER_ID: '223703707118731264',
	DISCORD_AVATAR_URL(hash: string, size = 32): string {
		return `https://cdn.discordapp.com/avatars/${CONSTANTS.DISCORD_USER_ID}/${hash}.png?size=${size}`;
	},
	ASSET_URL(appId: string, assetId: string): string {
		return `https://cdn.discordapp.com/app-assets/${appId}/${assetId}.png`;
	},
	LANYARD: {
		USER: (id: string) => `https://api.lanyard.rest/v1/users/${id}`,
		WSS: 'wss://api.lanyard.rest/socket',
	},
} as const;

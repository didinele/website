export const CONSTANTS = {
	DISCORD_USER_ID: '223703707118731264',
	DISCORD_AVATAR_URL(hash: string, size = 32): string {
		return `https://cdn.discordapp.com/avatars/${CONSTANTS.DISCORD_USER_ID}/${hash}.png?size=${size}`;
	},
} as const;

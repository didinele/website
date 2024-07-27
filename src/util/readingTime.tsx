import { DateTime } from 'luxon';
import { toString as mdAstToString } from 'mdast-util-to-string';
import getReadingTime from 'reading-time';

export function getHumanReadingTime(md: any) {
	const { minutes } = getReadingTime(md);

	const dt = DateTime.now();
	const doneAt = dt.plus({ minutes: Math.ceil(minutes) });
	const duration = doneAt.diff(dt, ['minutes']).as('minutes');

	return `${duration} minute read`;
}

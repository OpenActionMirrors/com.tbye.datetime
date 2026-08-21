export const DEFAULT_SETTINGS: {
	dtsegment: string;
	dateformat: string;
	hourformat: string;
	language: string;
};

export function normalizeSettings(settings: unknown): {
	dtsegment: string;
	dateformat: string;
	hourformat: string;
	language: string;
};

export function resolveLocale(language?: string): string | undefined;
export function formatWeekday(d: Date, language?: string, style?: string): string;
export function formatMonthName(d: Date, language?: string, style?: string): string;
export function formatAmPm(d: Date, language?: string): string;
export function msUntilNextSecond(nowMs?: number): number;
export function msUntilNextMinute(nowMs?: number): number;
export function msUntilNextLocalHour(d: Date | number): number;
export function formatDate(d: Date, dateformat?: string, includeYear?: boolean, language?: string): string;
export function formatTime(
	d: Date,
	hourformat?: string,
	showSeconds?: boolean,
	showAmPm?: boolean,
	language?: string
): string;
export function formatDateTime(d: Date, settings: unknown): string;
export function getTimeoutDelay(d: Date, settingsOrSegment: unknown): number;
export function getOrdinalNumber(day: number | string): string;
export function getISOWeekNumber(d: Date): number;
export function getClipboardText(settings: unknown, d?: Date): string;

import {
	action,
	KeyDownEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent,
	DidReceiveSettingsEvent,
	type KeyAction
} from "@elgato/streamdeck";

import { copyTextToClipboard } from "../clipboard";
import {
	formatDateTime,
	getClipboardText,
	msUntilNextSecond,
	normalizeSettings
} from "../datetime.js";

export type DateTimeSettings = {
	dtsegment?: string;
	dateformat?: string;
	hourformat?: string;
	language?: string;
};

type NormalizedSettings = {
	dtsegment: string;
	dateformat: string;
	hourformat: string;
	language: string;
};

type LiveTile = {
	action: KeyAction<DateTimeSettings>;
	settings: NormalizedSettings;
};

const activeContexts = new Map<string, LiveTile>();
let sharedTickTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * DateTime Segments action: paints a live date/time fragment on the key
 * and copies that value to the clipboard on press.
 */
@action({ UUID: "com.tbye.datetime.action" })
export class DateTimeAction extends SingletonAction<DateTimeSettings> {
	override async onWillAppear(ev: WillAppearEvent<DateTimeSettings>): Promise<void> {
		if (!ev.action.isKey()) {
			return;
		}
		const settings = normalizeSettings(ev.payload.settings) as NormalizedSettings;
		if (!ev.payload.settings || !ev.payload.settings.dtsegment) {
			await ev.action.setSettings(settings);
		}
		registerContext(ev.action, settings);
	}

	override onWillDisappear(ev: WillDisappearEvent<DateTimeSettings>): void {
		unregisterContext(ev.action.id);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<DateTimeSettings>): void {
		if (!ev.action.isKey()) {
			return;
		}
		registerContext(ev.action, normalizeSettings(ev.payload.settings) as NormalizedSettings);
	}

	override async onKeyDown(ev: KeyDownEvent<DateTimeSettings>): Promise<void> {
		const live = activeContexts.get(ev.action.id);
		const settings = live?.settings || (normalizeSettings(ev.payload.settings) as NormalizedSettings);
		const text = getClipboardText(settings, new Date());
		const ok = await copyTextToClipboard(text);
		if (ok) {
			await ev.action.showOk();
		} else {
			await ev.action.showAlert();
		}
	}
}

function registerContext(action: KeyAction<DateTimeSettings>, settings: NormalizedSettings): void {
	if (!settings.dtsegment) {
		return;
	}
	activeContexts.set(action.id, { action, settings });
	void action.setTitle(formatDateTime(new Date(), settings));
	ensureSharedTick();
}

function unregisterContext(id: string): void {
	activeContexts.delete(id);
	if (activeContexts.size === 0 && sharedTickTimeoutId != null) {
		clearTimeout(sharedTickTimeoutId);
		sharedTickTimeoutId = null;
	}
}

function ensureSharedTick(): void {
	if (sharedTickTimeoutId != null) {
		return;
	}
	scheduleSharedTick();
}

function scheduleSharedTick(): void {
	if (sharedTickTimeoutId != null) {
		clearTimeout(sharedTickTimeoutId);
	}
	sharedTickTimeoutId = setTimeout(onSharedTick, msUntilNextSecond());
}

function onSharedTick(): void {
	sharedTickTimeoutId = null;
	if (activeContexts.size === 0) {
		return;
	}

	const d = new Date();
	for (const tile of activeContexts.values()) {
		void tile.action.setTitle(formatDateTime(d, tile.settings));
	}

	scheduleSharedTick();
}

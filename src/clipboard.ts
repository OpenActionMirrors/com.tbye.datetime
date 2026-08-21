import { spawn } from "node:child_process";

/**
 * Copy plain text to the system clipboard.
 * Stream Deck plugins run in Node, not Chromium, so this uses OS clipboards.
 * @returns true if the write appears to have succeeded
 */
export async function copyTextToClipboard(text: string | null | undefined): Promise<boolean> {
	const value = text == null ? "" : String(text);
	if (process.platform === "darwin") {
		return pipeToCommand("pbcopy", [], value);
	}
	if (process.platform === "win32") {
		return copyOnWindows(value);
	}
	if (await pipeToCommand("wl-copy", [], value)) {
		return true;
	}
	return pipeToCommand("xclip", ["-selection", "clipboard"], value);
}

function copyOnWindows(value: string): Promise<boolean> {
	// Set-Clipboard handles Unicode; clip.exe is ANSI-oriented.
	return pipeToCommand(
		"powershell",
		["-NoProfile", "-NonInteractive", "-Command", "Set-Clipboard -Value $input"],
		value
	);
}

function pipeToCommand(command: string, args: string[], value: string): Promise<boolean> {
	return new Promise((resolve) => {
		let settled = false;
		const finish = (ok: boolean) => {
			if (settled) {
				return;
			}
			settled = true;
			resolve(ok);
		};

		let child;
		try {
			child = spawn(command, args, {
				stdio: ["pipe", "ignore", "ignore"],
				windowsHide: true
			});
		} catch {
			finish(false);
			return;
		}

		child.on("error", () => finish(false));
		child.on("close", (code) => finish(code === 0));
		child.stdin.on("error", () => finish(false));
		child.stdin.end(value, "utf8");
	});
}

import { IANAZone, DateTime } from "luxon";

export function isLeetMessage(messageId: bigint, timezone: string): boolean {
	const t = DateTime.fromMillis(Number((messageId >> 22n) + 1420070400000n), {
		zone: timezone,
	});
	return t.hour === 13 && t.minute === 37;
}

export interface Configuration {
	token: string;
	clientId: string;
	timezone: string;
	dbPath: string;
}

export function loadConfig(): Configuration {
	checkDotEnv();
	const tz = process.env["TIMEZONE"] || "Europe/Oslo";
	if (!IANAZone.isValidZone(tz)) {
		console.error(`"${tz}" is not a valid timezone, exiting...`);
		process.exit(1);
	}
	return {
		timezone: tz,
		token: process.env["DISCORD_TOKEN"]!,
		dbPath: process.env["DB_PATH"] || "data.db",
		clientId: process.env["CLIENT_ID"]!,
	};
}

function checkDotEnv() {
	const required = ["DISCORD_TOKEN", "CLIENT_ID"];
	for (const param of required) {
		if (!process.env[param]) {
			console.error("Missing required environment variable: " + param);
			process.exit(1);
		}
	}
}

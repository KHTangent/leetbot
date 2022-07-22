export function isLeetMessage(messageId: bigint, timezone = 0): boolean {
	const t = new Date(Number((messageId >> 22n) + 1420070400000n));
	return t.getUTCHours() + timezone === 13 && t.getUTCMinutes() === 37;
}

export interface Configuration {
	token: string;
	timezone: number;
	dbPath: string;
}

export function loadConfig(): Configuration {
	checkDotEnv();
	const timezone = parseInt(process.env["TIMEZONE"]!);
	if (isNaN(timezone)) {
		console.error("TIMEZONE must be an integer");
	}
	return {
		timezone,
		token: process.env["DISCORD_TOKEN"]!,
		dbPath: process.env["DB_PATH"] || "data.db",
	};
}

function checkDotEnv() {
	const required = ["DISCORD_TOKEN", "TIMEZONE"];
	for (const param of required) {
		if (!process.env[param]) {
			console.error("Missing required environment variable: " + param);
			process.exit(1);
		}
	}
}

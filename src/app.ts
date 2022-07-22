import * as Discord from "discord.js";
import "dotenv/config";
import { loadConfig, isLeetMessage } from "./utils";
import { initDB, closeDB } from "./db";

(async () => {
	console.log("Starting leetbot...");

	console.log("Loading config...");
	const config = loadConfig(); // Halts if a required parameter is missing
	console.log("Config loaded. Connecting to DB...");
	await initDB(config);
	console.log("Database connection established. Starting bot...");

	const bot = new Discord.Client({
		intents: [
			Discord.GatewayIntentBits.Guilds,
			Discord.GatewayIntentBits.GuildMessages,
			Discord.GatewayIntentBits.DirectMessages,
			Discord.GatewayIntentBits.MessageContent,
		],
	});

	bot.on("ready", () => {
		console.log(`Logged in as ${bot.user?.username}`);
	});

	bot.on("messageCreate", (msg) => {
		if (msg.content === "leet") {
			if (isLeetMessage(BigInt(msg.id), config.timezone)) {
				msg.channel.send("Good leet");
			} else {
				msg.channel.send("Bad leet");
			}
		}
	});

	process.on("SIGINT", async () => {
		console.log("Exiting...");
		bot.destroy();
		await closeDB();
		process.exit();
	});

	bot.login(config.token);
})();

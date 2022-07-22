import * as Discord from "discord.js";
import "dotenv/config";
import { loadConfig, isLeetMessage } from "./utils";

const config = loadConfig(); // Halts if a required parameter is missing

(async () => {
	console.log("Starting leetbot...");
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

	bot.login(config.token);
})();

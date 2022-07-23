import * as Discord from "discord.js";
import { REST } from "@discordjs/rest";
import "dotenv/config";
import { loadConfig, isLeetMessage } from "./utils";
import { initDB, closeDB } from "./db";
import { LeetGuild } from "./models";

const commands = [
	new Discord.SlashCommandBuilder()
		.setName("initleeting")
		.setDescription("Enable leeting in this server")
		.setDMPermission(false)
		.setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setRequired(true)
				.setDescription("Channel to look for leeting in")
				.addChannelTypes(Discord.ChannelType.GuildText)
		),
	new Discord.SlashCommandBuilder()
		.setName("leeterboard")
		.setDMPermission(false)
		.setDescription("Gives a list of the top 10 leeters in the server"),
];

(async () => {
	console.log("Starting leetbot...");

	console.log("Loading config...");
	const config = loadConfig(); // Halts if a required parameter is missing
	console.log("Config loaded. Connecting to DB...");
	await initDB(config);
	console.log("Database connection established. Starting bot...");

	console.log("Registering slash commands...");
	const rest = new REST({ version: "10" }).setToken(config.token);
	commands.map((c) => c.toJSON());
	await rest.put(Discord.Routes.applicationCommands(config.clientId), {
		body: commands.map((c) => c.toJSON()),
	});
	console.log("Registered commands");

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
		if (msg.content.length == 4 && msg.content.toLocaleLowerCase() === "leet") {
			if (isLeetMessage(BigInt(msg.id), config.timezone)) {
				msg.channel.send("Good leet");
			} else {
				msg.channel.send("Bad leet");
			}
		}
	});

	bot.on("interactionCreate", async (interaction) => {
		if (!interaction.isChatInputCommand()) return;

		if (interaction.commandName === "initleeting") {
			const channel = interaction.options.getChannel("channel", true);
			if (channel.type !== Discord.ChannelType.GuildText) {
				await interaction.reply("Must be a text channel");
				return;
			}
			const fullChannel = await interaction.guild?.channels.fetch(channel.id);
			if (!fullChannel) {
				await interaction.reply("Unable to find that channel in this guild");
				return;
			}
			try {
				await LeetGuild.create(interaction.guild!.id, fullChannel.id);
				await interaction.reply("The leeting has begun!");
			} catch (e: unknown) {
				console.log(e);
				await interaction.reply(
					"Failed to initialize leeting. Maybe it's already enabled in this guild?"
				);
			}
		} else if (interaction.commandName === "leeterboard") {
			await interaction.reply("Not implemented yet");
		} else {
			await interaction.reply("Command not found");
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

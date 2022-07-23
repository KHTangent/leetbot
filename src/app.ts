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

let leetCache: Record<string, string[]> = {};

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
			Discord.GatewayIntentBits.MessageContent,
		],
	});

	bot.on("ready", () => {
		console.log(`Logged in as ${bot.user?.username}`);
	});

	bot.on("messageCreate", async (msg) => {
		if (
			msg.content.toLocaleLowerCase() === "leet" &&
			isLeetMessage(BigInt(msg.id), config.timezone)
		) {
			try {
				const lg = await LeetGuild.fromChannelId(msg.channel.id);
				if (!lg) {
					return; // No leeting in that channel, despite honorary efforts
				}
				if (!leetCache[msg.channel.id]) {
					// Set up a "commit leet" for when the leetable minute has passed
					if (Object.keys(leetCache).length === 0) {
						setTimeout(async () => {
							for (const channel in leetCache) {
								const lg = await LeetGuild.fromChannelId(channel);
								if (lg) {
									await lg.addLeets(leetCache[channel]);
								}
							}
							leetCache = {};
						}, 61 * 1000);
					}
					leetCache[msg.channel.id] = [];
				}
				if (!leetCache[msg.channel.id].includes(msg.author.id)) {
					leetCache[msg.channel.id].push(msg.author.id);
				}
			} catch (e) {
				console.error(e);
				return;
			}
		}
	});

	bot.on("interactionCreate", async (interaction) => {
		if (!interaction.isChatInputCommand()) return;

		if (interaction.commandName === "initleeting") {
			const channel = interaction.options.getChannel("channel", true);
			if (channel.type !== Discord.ChannelType.GuildText) {
				await interaction.reply("Channel must be a text channel");
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
			const lg = await LeetGuild.fromGuildId(interaction.guild!.id);
			if (!lg) {
				await interaction.reply("Leeting is not enabled in this server");
				return;
			}
			const top10 = await lg.getHighscores(10);
			if (top10.length === 0) {
				await interaction.reply("Nobody has leeted in this server yet :(");
				return;
			}
			const embed = new Discord.EmbedBuilder()
				.setTitle(`Best leeters in **${interaction.guild!.name}**`)
				.setColor(0x0078d7)
				.addFields(
					{
						name: "Scores",
						value: top10.map((e) => `<@${e.userId}>: ${e.score}`).join("\n"),
					},
					{
						name: "Want to leet?",
						value:
							`Send a message containing only the word "leet" in <#${lg.leetChannel}> ` +
							`at exactly 13:37 to earn a point! (timezone: ${config.timezone})`,
					}
				);
			await interaction.reply({
				embeds: [embed],
				allowedMentions: {
					users: [],
				},
			});
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

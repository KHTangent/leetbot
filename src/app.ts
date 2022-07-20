import * as Discord from "discord.js";
import "dotenv/config";
import { checkDotEnv, isLeetMessage } from "./utils";

checkDotEnv(); // Halt if a required parameter is missing
const TIMEZONE = parseInt(process.env.TIMEZONE!);

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
      if (isLeetMessage(BigInt(msg.id), TIMEZONE)) {
        msg.channel.send("Good leet");
      } else {
        msg.channel.send("Bad leet");
      }
    }
  });

  bot.login(process.env.DISCORD_TOKEN);
})();

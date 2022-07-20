export function isLeetMessage(messageId: bigint, timezone = 0): boolean {
  const t = new Date(Number((messageId >> 22n) + 1420070400000n));
  return t.getUTCHours() + timezone === 13 && t.getUTCMinutes() === 37;
}

export function checkDotEnv() {
  const required = ["DISCORD_TOKEN", "TIMEZONE"];
  for (const param of required) {
    if (!process.env[param]) {
      console.log("Missing required environment variable: " + param);
      process.exit(1);
    }
  }
}

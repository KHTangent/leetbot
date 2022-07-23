import { getDB } from "./db";

interface LeetScore {
	userId: string;
	score: number;
}

export class LeetGuild {
	/**
	 * Guild ID
	 */
	id: string;

	/**
	 * Channel to look for leets in
	 */
	leetChannel: string;

	private constructor(id: string, channel: string) {
		this.id = id;
		this.leetChannel = channel;
	}

	/**
	 * Finds a LeetGuild object in the database
	 * @param id Guild ID to search for
	 * @returns LeetGuild if it exists, otherwise null
	 */
	static async fromGuildId(id: string): Promise<LeetGuild | null> {
		const db = await getDB();
		const row = await db.get(
			"SELECT id, leetchannel FROM guilds WHERE id = ?",
			[id]
		);
		if (!row) return null;
		else return new LeetGuild(row.id, row.leetchannel);
	}

	/**
	 * Finds a LeetGuild object in the database
	 * @param id Channel ID to search for
	 * @returns LeetGuild if it exists, otherwise null
	 */
	static async fromChannelId(id: string): Promise<LeetGuild | null> {
		const db = await getDB();
		const row = await db.get(
			"SELECT id, leetchannel FROM guilds WHERE leetchannel = ?",
			[id]
		);
		if (!row) return null;
		else return new LeetGuild(row.id, row.leetchannel);
	}

	/**
	 * Enable leeting in a new guild
	 * @param guild Guild/server ID
	 * @param channel Channel ID to look for leets in
	 * @returns LeetGuild object
	 * @throws if unique constraint fails
	 */
	static async create(guild: string, channel: string): Promise<LeetGuild> {
		const db = await getDB();
		await db.run("INSERT INTO guilds(id, leetchannel) VALUES (?, ?)", [
			guild,
			channel,
		]);
		return (await this.fromGuildId(guild))!;
	}

	/**
	 * Change leet channel in this guild
	 * @param channel New channel to look for leets in
	 */
	async setChannel(channel: string): Promise<void> {
		const db = await getDB();
		await db.run("UPDATE guilds SET leetchannel = ? WHERE id = ?", [
			channel,
			this.id,
		]);
		this.leetChannel = channel;
	}

	/**
	 * Increment users who leeted by one
	 * @param users Array of user IDs to increment leet score by 1 for
	 */
	async addLeets(users: string[]): Promise<void> {
		const db = await getDB();
		await db.run("BEGIN TRANSACTION");
		for (const user of users) {
			try {
				await db.run(
					"INSERT OR IGNORE INTO leetscore(guildid, userid) VALUES (?, ?)",
					[this.id, user]
				);
				await db.run(
					"UPDATE leetscore SET score = score + 1 WHERE userid = ?",
					[user]
				);
			} catch (e) {
				await db.run("ROLLBACK");
				return;
			}
		}
		await db.run("COMMIT");
	}

	/**
	 * Get a scoreboard for a server. Note that only people who have leeted once are included
	 * @param limit How many highscores to fetch
	 * @returns Array of objects which maps user ID to score
	 */
	async getHighscores(limit = 10): Promise<LeetScore[]> {
		const db = await getDB();
		const rows = await db.all(
			"SELECT userid, score FROM leetscore " +
				"WHERE guildid = ? ORDER BY score DESC LIMIT ?"[(this.id, limit)]
		);
		return rows.map((row) => {
			return {
				userId: row.userid,
				score: row.score,
			};
		});
	}

	/**
	 * Destroy all leet data for this guild, including all scores
	 */
	async destroy(): Promise<void> {
		const db = await getDB();
		await db.run("DELETE FROM leetscore WHERE guildid", [this.id]);
		await db.run("DELETE FROM guilds WHERE id = ?", [this.id]);
	}
}

import { getDB } from "./db";

interface LeetScore {
	userId: bigint;
	score: number;
}

export class LeetGuild {
	/**
	 * Guild ID
	 */
	id: bigint;

	/**
	 * Channel to look for leets in
	 */
	leetChannel: bigint;

	private constructor(id: bigint, channel: bigint) {
		this.id = id;
		this.leetChannel = channel;
	}

	/**
	 * Finds a LeetGuild object in the database
	 * @param id Guild ID to search for
	 * @returns LeetGuild if it exists, otherwise null
	 */
	static async fromGuildId(id: bigint): Promise<LeetGuild | null> {
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
	static async fromChannelId(id: bigint): Promise<LeetGuild | null> {
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
	static async create(guild: bigint, channel: bigint): Promise<LeetGuild> {
		const db = await getDB();
		await db.exec("INSERT INTO guilds(id, leetchannel) VALUES (?, ?)", [
			guild,
			channel,
		]);
		return (await this.fromGuildId(guild))!;
	}

	/**
	 * Change leet channel in this guild
	 * @param channel New channel to look for leets in
	 */
	async setChannel(channel: bigint): Promise<void> {
		const db = await getDB();
		await db.exec("UPDATE guilds SET leetchannel = ? WHERE id = ?", [
			channel,
			this.id,
		]);
		this.leetChannel = channel;
	}

	/**
	 * Increment users who leeted by one
	 * @param users Array of user IDs to increment leet score by 1 for
	 */
	async addLeets(users: bigint[]): Promise<void> {
		const db = await getDB();
		await db.exec("BEGIN TRANSACTION");
		for (const user of users) {
			try {
				await db.exec(
					"INSERT OR IGNORE INTO leetscore(guildid, userid) VALUES (?, ?)",
					[this.id, user]
				);
				await db.exec(
					"UPDATE leetscore SET score = score + 1 WHERE userid = ?",
					[user]
				);
			} catch (e) {
				await db.exec("ROLLBACK");
				return;
			}
		}
		await db.exec("COMMIT");
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
		await db.exec("DELETE FROM leetscore WHERE guildid", [this.id]);
		await db.exec("DELETE FROM guilds WHERE id = ?", [this.id]);
	}
}

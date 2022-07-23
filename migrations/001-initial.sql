--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

PRAGMA foreign_keys = ON;

CREATE TABLE guilds (
	id TEXT NOT NULL UNIQUE,
	leetchannel TEXT NOT NULL
);

CREATE TABLE leetscore (
	guildid TEXT NOT NULL,
	userid TEXT NOT NULL,
	score INT NOT NULL DEFAULT 0,
	FOREIGN KEY (guildid) REFERENCES guilds(guild),
	UNIQUE (guildid, userid)
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE leetscore;
DROP TABLE guilds;

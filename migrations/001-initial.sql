--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

PRAGMA foreign_keys = ON;

CREATE TABLE guilds (
	id INT NOT NULL UNIQUE,
	leetchannel INT NOT NULL
);

CREATE TABLE leetscore (
	guildid INT NOT NULL,
	userid INT NOT NULL,
	score INT NOT NULL DEFAULT 0,
	FOREIGN KEY (guildid) REFERENCES guilds(guild)
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE leetscore;
DROP TABLE guilds;

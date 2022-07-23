# Leetbot

## Setup guide

First, install a recent version of Node.js. I recommend using [NVM-sh](https://github.com/nvm-sh/nvm) for this on Linux. It's probably useful to install `git` as well, but it is not required.

Now, for the actual installation.

1: Create a new application from the [Discord Developer dashboard](https://discord.com/developers/applications).
2: After creating the application, go to the `OAuth2` tab of the new application, and take note of the Client ID. It should be a numeric value.
3: Go to the Bot tab of your application, and add a bot. Save the token for later.
4: Clone this project onto the device you want to host the bot on:

```bash
git clone https://github.com/KHTangent/leetbot
```

5: Create a new text file inside the newly cloned `leetbot` directory. Name the file `.env`

```bash
cd leetbot
nano .env
```

6: Use this template to populate the file:

```bash
DISCORD_TOKEN=tokenfrom3
TIMEZONE=Europe/Oslo
CLIENT_ID=clientidfrom2
```

7: Install project dependencies:

```bash
npm i
```

8: Start the bot:

```bash
npm run start
```

9: Add the bot to your server using the following URL. Make sure to substitute your Client ID from step 2:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147486720&scope=bot
```

10: Go to the server you added the bot to, and use the `/initleeting` command to begin leeting. Enjoy!

## Set up autorestart with `pm2`

If you want to make sure the bot restarts if it should crash, you can use pm2 by executing the following commands from the `leetbot` folder.

0: Stop the bot if it's still running
1: Install `pm2`:

```bash
npm i --global pm2
```

2: Start the app with `pm2`. Make sure you've ran the bot with `npm run start` at least once before doing this.

```bash
pm2 start build/app.js --name leetbot
```

3: (optional) Make the bot run on startup with the following two commands:

```
pm2 startup
pm2 save
```

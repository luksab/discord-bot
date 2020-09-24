const fs = require('fs')
const Discord = require('discord.js');
const Client = require('./client/Client');
const {
	prefix,
	token,
} = require('./config.json');
const { PassThrough } = require('stream');

const client = new Client();
client.commands = new Discord.Collection();
client.rrRate = 0.01;
client.owner = "393450329724682240";

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// console.log(client.commands);

client.once('ready', () => {
	console.log('Ready!');
	client.users.cache.get(client.owner).send("Ready!");
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('message', async message => {
	if (message.author.bot) return;
	if (message.channel.type !== 'dm') return;
	if (message.content.match(/^help([\.\!\?]|$)/im))
		client.commands.get("help").execute(message, client);
});

client.on('message', async message => {
	if (message.author.bot) return;
	let found = message.content.match(new RegExp(/(?:^| |\.)(i(?:'?m| am))((?: \w+){1,3})(?:\.|\!|$)/im));
	if (found)
		message.channel.send("Hello" + found[2] + "! " + found[1] + " dad.");
});

client.on('message', async message => {
	if (message.author.bot) return;
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName);

	if (!message.content.startsWith(prefix)) return;
	if (!command) {
		console.log("unknown command. Type " + prefix + "help for all commands.")
		return message.channel.send("unknown command. Type " + prefix + "help for all commands.");
	}


	try {
		command.execute(message, client);
	} catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!');
	}
});


client.login(token);

process.on('uncaughtException', function (err) {
	try {
		client.users.cache.get(client.owner).send('Caught exception: \n' + err, { split: { "maxLength": 2000 } });
	} catch (e) { }
    console.log('Caught exception: ', err);
});

process.on('unhandledRejection', err => {
	try {
		client.users.cache.get(client.owner).send('Caught rejection: \n' + err, { split: { "maxLength": 2000 } });
	} catch (e) { }
	console.log('Caught rejection: ', err);
});
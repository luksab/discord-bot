const fs = require('fs')
const Discord = require('discord.js');
const Client = require('./client/Client');
const {
	prefix,
	token,
} = require('./config.json');

const client = new Client();
client.commands = new Discord.Collection();
client.rrRate = 0.05;

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// console.log(client.commands);

client.once('ready', () => {
	console.log('Ready!');
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('message', async message => {
	if (message.author.bot) return;

	for (let im of ["I'm", "i'm", "Im", "im", "I am", "i am"]) {
		let index = message.content.indexOf(im);
		while (index > 0) {
			index += im.length;
			let end = (message.content + ".").indexOf(".", index);
			if (end > index) {
				let result = message.content.substring(index, end).trim();
				if (result.includes(",")){
					result=result.substring(0,result.indexOf(","));
				}
				if (result.length-result.replace(/\ /g,"").length<3){
					return message.channel.send("Hello " + result + "! "+im+" dad.");
				}
			}
			index=message.content.indexOf(im,index);
		}
	}
});

client.on('message', async message => {
	if (message.author.bot) return;
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName);

	if (!message.content.startsWith(prefix)) return;
	if (!command) return message.reply("unknown command. Type " + prefix + "help for all commands.");


	try {
		command.execute(message, client);
	} catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!');
	}
});


client.login(token);

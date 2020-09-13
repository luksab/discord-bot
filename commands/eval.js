const { exec } = require("child_process");

module.exports = {
	name: 'js',
	description: 'I and only I can execute a js command :P',
	noHelp: true,
	execute(message, client) {
		if (message.author.id === "393450329724682240") {
			const msg = eval(message.content.substring("$js ".length));
			message.channel.send("```" + msg + "```", { split: { "maxLength": 2000 } });
		}
		else return message.channel.send("You don't have permission over me!");
	},
};

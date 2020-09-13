const { exec } = require("child_process");

module.exports = {
	name: 'sh',
	description: 'I and only I can execute a shell command :P',
	execute(message) {
		if (message.author.id === "393450329724682240")
			exec(message.content.substring("$sh ".length), (error, stdout, stderr) => {
				if (error) {
					message.channel.send("error: \n```"+error.message+"```", { split: { "maxLength": 2000 } });
					return;
				}
				if (stderr) {
					message.channel.send("stderr: \n```"+stderr+"```", { split: { "maxLength": 2000 } });
					return;
				}
				message.channel.send("stdout: \n```"+stdout+"```", { split: { "maxLength": 2000 } });
			});
		else return message.channel.send("You don't have permission over me!");
	},
};

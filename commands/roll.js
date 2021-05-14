module.exports = {
	name: 'roll',
	description: 'roll dice in dnd notation (eg. 2d20)',
	execute(message) {
		const args = message.content.split(" ");
		const dice = args[1].split("d");
		if (dice[0] < 1) return message.channel.send("I can't roll < 1 dice, dummy.")
		if (dice[0] > 1000) return message.channel.send("Thats too many dice - I don't want to overload my server.")
		const throws = Array.from({ length: dice[0] }, () => (Math.random() * dice[1] + 1.) | 0);

		const msg = throws.join(",") + (throws.length > 1 ? (" = " + throws.reduce((a, b) => a + b)) : "")
		if(msg.length > 2000)return message.channel.send("Thats too many dice - discord messages can only be 2000 characters in length.")
		message.channel.send(msg);
	},
};

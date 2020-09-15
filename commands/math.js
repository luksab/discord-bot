const mathjs = require('mathjs');

module.exports = {
	name: 'math',
	description: 'evlauate a math.js expression',
	execute(message) {
		const expression = message.content.substring(message.content.indexOf(" ") + 1);
		message.channel.send("`"+mathjs.parse(expression)+" = "+mathjs.simplify(expression).toString()+"`")
	},
};

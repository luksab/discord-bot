const os = require('os');

function format(seconds) {
    function pad(s) {
        return (s < 10 ? '0' : '') + s;
    }
    var days = Math.floor(seconds / (60 * 60 * 24))
    var hours = Math.floor(seconds % (60 * 60 * 24) / (60 * 60));
    var minutes = Math.floor(seconds % (60 * 60) / 60);
    var seconds = Math.floor(seconds % 60);

    return pad(days) + ':' + pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}


module.exports = {
    name: 'uptime',
    description: 'Get the uptime of the bot.',
    execute(message) {
        const args = message.content.split(" ");
        if (args[1] == "os")
            message.channel.send(format(os.uptime()));
        else
            message.channel.send(format(process.uptime()));
    },
};
const fs = require('fs');
const path = require('path');

const banListPath = path.join(__dirname, '..', '..', 'banlist.json');

function getBanList() {
    try {
        if (fs.existsSync(banListPath)) {
            return JSON.parse(fs.readFileSync(banListPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading ban list:', error);
    }
    return [];
}

module.exports = {
    run: async ({ event, api, config, commands }) => {
        if (!event.body) return;

        const body = event.body.trim();
        if (!body.startsWith(config.prefix)) return;

        const args = body.slice(config.prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        const command = commands.get(commandName);
        if (!command) return;

        const banList = getBanList();
        if (banList.includes(event.senderID)) {
            return api.sendMessage('❌ You are banned from using this bot.', event.threadID);
        }

        const senderID = event.senderID;
        const isOwner = senderID === config.ownerId;
        const isAdmin = config.admins.includes(senderID);
        const isOperator = config.operators.includes(senderID);

        let userRole = 0;
        if (isOwner) userRole = 2;
        else if (isAdmin || isOperator) userRole = 1;

        if (command.config.role > userRole) {
            return api.sendMessage('❌ You do not have permission to use this command.', event.threadID);
        }

        try {
            await command.run({
                api,
                event,
                args,
                config,
                commands,
                userRole
            });
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            api.sendMessage(`❌ Error executing command: ${error.message}`, event.threadID);
        }
    }
};

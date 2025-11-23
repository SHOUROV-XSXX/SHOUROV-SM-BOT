const fs = require('fs');
const login = require('facebook-chat-api');
const express = require('express');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const { loadCommands, loadEvents } = require('./shourov/loader');

console.log('═══════════════════════════════════════════');
console.log('   SHOUROV-BOT - Facebook Messenger Bot   ');
console.log('═══════════════════════════════════════════');

if (config.author !== "ALIHSAN SHOUROV") {
    console.error('❌ CRITICAL ERROR: Author protection violated!');
    console.error(`Expected author: "ALIHSAN SHOUROV"`);
    console.error(`Found: "${config.author}"`);
    console.error('Bot will not start. Please restore the original author.');
    process.exit(1);
}

if (config.ownerId !== "100071971474157") {
    console.error('❌ CRITICAL ERROR: Owner ID protection violated!');
    console.error(`Expected ownerId: "100071971474157"`);
    console.error(`Found: "${config.ownerId}"`);
    console.error('Bot will not start. Please restore the original owner ID.');
    process.exit(1);
}

console.log('✓ Author protection: PASSED');
console.log('✓ Owner ID protection: PASSED');
console.log('');

const startUptimeServer = require('./server/uptime');
startUptimeServer(config);

let appState;
try {
    appState = JSON.parse(fs.readFileSync('./fbstate.json', 'utf8'));
    console.log('✓ Facebook state loaded');
} catch (err) {
    console.error('❌ Error loading fbstate.json:', err.message);
    console.error('Please ensure fbstate.json contains valid Facebook session data.');
    process.exit(1);
}

if (!appState || appState.length === 0) {
    console.warn('⚠️  Warning: fbstate.json is empty or invalid.');
    console.warn('Please paste your Facebook session cookies into fbstate.json');
    console.warn('Bot will keep running but cannot connect to Facebook yet.');
    console.log('');
    console.log('Uptime server is running. Waiting for valid fbstate...');
    return;
}

login({ appState }, (err, api) => {
    if (err) {
        console.error('❌ Facebook login error:', err);
        console.error('Please check your fbstate.json file.');
        return;
    }

    console.log('✓ Facebook login successful');

    api.setOptions({
        listenEvents: true,
        logLevel: 'silent',
        updatePresence: true,
        selfListen: false,
        forceLogin: true
    });

    const commands = loadCommands();
    const events = loadEvents();

    console.log(`✓ Loaded ${commands.size} commands`);
    console.log(`✓ Loaded ${events.length} events`);
    console.log('');
    console.log('🤖 Bot is now online and ready!');
    console.log('═══════════════════════════════════════════');

    const listenMqtt = api.listenMqtt(async (err, event) => {
        if (err) {
            console.error('Listen error:', err);
            return;
        }

        for (const eventHandler of events) {
            try {
                await eventHandler.run({ event, api, config, commands });
            } catch (error) {
                console.error(`Error in event ${eventHandler.name}:`, error);
            }
        }

        if (event.type === 'message' || event.type === 'message_reply') {
            try {
                const messageHandler = require('./shourov/events/message');
                await messageHandler.run({ event, api, config, commands });
            } catch (error) {
                console.error('Error in message handler:', error);
            }
        }
    });
});

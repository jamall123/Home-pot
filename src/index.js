const config = require('./config');
const bot = require('./bot');
const { log } = require('./utils/logger');
const { handleContentGeneration } = require('./handlers/content');
const { handlePoll } = require('./handlers/poll');
const { handleEvent } = require('./handlers/event');
const http = require('http');

// ============ Keep-Alive Server ============
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Bot is working! 🤖\n');
});

server.listen(config.port, () => {
    log('INFO', `🌍 Keep-alive server running on port ${config.port}`);
});

// ============ Bot Commands ============

bot.start((ctx) => {
    ctx.reply(
        '👋 *Welcome to Home-Bot v2!* 🤖\n\n' +
        'I manage your channel with AI.\n\n' +
        '*Commands:*\n' +
        '📝 Send "Write about X" -> Generates a post.\n' +
        '❓ Send "/quiz X" -> Generates a poll.\n' +
        '📅 Send "/event Title | Date | Note" -> Publishes an event.\n',
        { parse_mode: 'Markdown' }
    );
});

bot.command('quiz', handlePoll);
bot.command('event', handleEvent);

// ============ Text Handler ============
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();

    if (text.startsWith('/')) return; // Ignore other commands

    // Check for "search" triggers or just assumed content generation
    const triggers = ['تحدث عن', 'اكتب عن', 'انشر عن', 'موضوع عن', 'كلم عن', 'write about'];
    let topic = '';

    for (const trigger of triggers) {
        if (text.toLowerCase().startsWith(trigger.toLowerCase())) {
            topic = text.slice(trigger.length).trim();
            break;
        }
    }

    // Default: if no trigger but it's a direct message to admin bot, maybe treat as topic?
    // The original code treated EVERYTHING not a command as a topic if it didn't find a trigger.
    if (!topic) topic = text;

    if (topic.length < 2) {
        return ctx.reply('⚠️ Topic is too short.');
    }

    await handleContentGeneration(ctx, topic);
});

// ============ Error Handling ============
bot.catch((err, ctx) => {
    log('ERROR', 'Global Bot Error', { error: err.message });
    if (ctx) ctx.reply('❌ An unexpected error occurred.');
});

// ============ Launch ============
bot.launch().then(() => {
    log('INFO', '✅ Bot started successfully!');
    log('INFO', `📢 Channel ID: ${config.channelId}`);
}).catch((err) => {
    log('ERROR', 'Failed to start bot', { error: err.message });
    process.exit(1);
});

// ============ Graceful Shutdown ============
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

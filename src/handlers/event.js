const config = require('../config');
const { log } = require('../utils/logger');

async function handleEvent(ctx) {
    // Format: /event Title | Date | Description
    const text = ctx.message.text.replace(/^\/event\s*/i, '').trim();
    const parts = text.split('|').map(p => p.trim());

    if (parts.length < 3) {
        return ctx.reply(
            '⚠️ Invalid format.\n' +
            'Usage: `/event Title | Date | Description`\n' +
            'Example: `/event Meeting | Tomorrow 9 PM | Discuss project roadmap`',
            { parse_mode: 'Markdown' }
        );
    }

    const [title, date, description] = parts;

    try {
        const message =
            `📅 *إعلان هام* 📅\n\n` +
            `📌 *العنوان:* ${title}\n` +
            `🕒 *الموعد:* ${date}\n\n` +
            `📝 *التفاصيل:*\n${description}\n\n` +
            `✨ ننتظر حضوركم!`;

        await ctx.telegram.sendMessage(config.channelId, message, { parse_mode: 'Markdown' });
        await ctx.reply('✅ Event announced in channel!');

    } catch (error) {
        log('ERROR', 'Event Handler Error', { error: error.message });
        await ctx.reply('❌ Error sending event: ' + error.message);
    }
}

module.exports = { handleEvent };

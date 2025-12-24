const groqService = require('../services/groq');
const config = require('../config');
const { log } = require('../utils/logger');

async function handleContentGeneration(ctx, topic) {
    try {
        await ctx.reply(`⏳ Writing about: "${topic}"...`);

        const prompt = `
You are a professional Telegram channel admin.
Task: Write a professional post about: "${topic}"

Rules:
1. Start with a catchy title or question.
2. Use emojis appropriately.
3. Split into 3-5 short paragraphs.
4. Be interactive and engaging.
5. Add value/useful info.
6. End with a call to action.
7. Do NOT mention you are an AI.
8. Language: Simple Arabic (MSA).
9. Length: 150-300 words.

Write the post now:
        `.trim();

        const text = await groqService.generate(prompt);

        // Send to channel
        await ctx.telegram.sendMessage(config.channelId, text, { parse_mode: 'Markdown' });

        // Confirm to user
        await ctx.reply('✅ Post published to channel!');

    } catch (error) {
        log('ERROR', 'Content Generation Error', { error: error.message });
        await ctx.reply('❌ Error generating content: ' + error.message);
    }
}

module.exports = { handleContentGeneration };

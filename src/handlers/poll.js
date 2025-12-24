const groqService = require('../services/groq');
const config = require('../config');
const { log } = require('../utils/logger');

async function handlePoll(ctx) {
    // Expected format: /poll topic
    // or just trigger from text
    const text = ctx.message.text;
    const topic = text.replace(/^\/quiz\s*/i, '').replace(/^سؤال عن\s*/i, '').trim();

    if (!topic) {
        return ctx.reply('⚠️ Please specify a topic for the quiz. Example: /quiz Programming');
    }

    try {
        await ctx.reply(`⏳ Generating quiz about: "${topic}"...`);

        const prompt = `
Generate a multiple-choice question (Poll) for a Telegram channel about: "${topic}".
Output MUST be valid JSON only, with this format:
{
  "question": "The question text in Arabic",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correct_option_id": 0  // Index of correct option (0-3)
}
Do not add any markdown blocks or extra text. JOIN ONLY.
        `.trim();

        const jsonStr = await groqService.generate(prompt, { temperature: 0.7 });
        let quizData;

        try {
            // clean potential markdown code blocks
            const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
            quizData = JSON.parse(cleanJson);
        } catch (e) {
            log('ERROR', 'Failed to parse Poll JSON', { response: jsonStr });
            return ctx.reply('❌ Failed to generate a valid quiz. Try again.');
        }

        if (!quizData.question || !quizData.options || quizData.options.length < 2) {
            return ctx.reply('❌ Invalid quiz format generated.');
        }

        // Send Poll to Channel
        await ctx.telegram.sendPoll(
            config.channelId,
            quizData.question,
            quizData.options,
            {
                type: 'quiz',
                correct_option_id: quizData.correct_option_id,
                is_anonymous: true
            }
        );

        await ctx.reply('✅ Quiz published to channel!');

    } catch (error) {
        log('ERROR', 'Poll Generation Error', { error: error.message });
        await ctx.reply('❌ Error generating poll: ' + error.message);
    }
}

module.exports = { handlePoll };

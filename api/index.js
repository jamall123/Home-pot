require('dotenv').config();
const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');

const botToken = process.env.BOT_TOKEN;
const apiKey = process.env.GROQ_API_KEY;
const channelId = process.env.CHANNEL_ID;
const adminId = process.env.ADMIN_ID;
const adminUsername = process.env.ADMIN_USERNAME;

const bot = new Telegraf(botToken);
const groq = new Groq({ apiKey: apiKey });

// --- Middlewares & Logic ---

// التأكد من أن المستخدم هو المسؤول (Admin)
bot.use(async (ctx, next) => {
    // للدعوات التي تأتي من الويب هوك، قد نحتاج للتأكد وجود from
    if (!ctx.from) return next();

    const userId = ctx.from.id.toString();
    const username = ctx.from.username;

    const isIdMatch = adminId && userId === adminId.toString();
    const isUsernameMatch = adminUsername && username && username.toLowerCase() === adminUsername.toLowerCase().replace('@', '');

    if ((!adminId && !adminUsername) || isIdMatch || isUsernameMatch) {
        return next();
    }

    return ctx.reply('🔒 عذراً، هذا البوت خاص بمدير القناة فقط.');
});

bot.start((ctx) => {
    ctx.reply(
        '👋 مرحباً بك!\n\n' +
        'أنا مساعدك الذكي لإدارة القناة. 🤖\n\n' +
        '📝 **كيفية الاستخدام:**\n' +
        'فقط أرسل لي عبارة مثل:\n' +
        '- "تحدث عن الذكاء الاصطناعي"\n' +
        '- "اكتب عن فوائد الرياضة"\n\n' +
        'وسأقوم بإنشاء منشور كامل وإرساله إلى قناتك فوراً! 🚀'
    );
});

async function generateAndPost(ctx, topic) {
    try {
        await ctx.reply(`⏳ **جاري التفكير والكتابة عن:** ${topic}...`);

        const prompt = `
            تصرف بصفتك مدير قناة تلجرام محترف ومبدع.
            المهمة: اكتب منشوراً لقناة تلجرام حول الموضوع: "${topic}".
            
            الشروط:
            1. ابدأ بعبارة جذابة أو عنوان مشوق.
            2. استخدم الإيموجي بشكل مناسب لجذب الانتباه.
            3. قسم النص إلى فقرات قصيرة لسهولة القراءة.
            4. اجعل الأسلوب تفاعلياً ومفيداً للمتابعين.
            5. لا تذكر أنك بوت أو ذكاء اصطناعي، تحدث كصاحب القناة.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-8b-8192",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });

        const text = chatCompletion.choices[0]?.message?.content || "";

        if (!text) throw new Error("لم يتم استلام أي نص من الموديل.");

        await bot.telegram.sendMessage(channelId, text);
        await ctx.reply(`✅ **تم النشر بنجاح!**\nيمكنك التحقق من القناة الآن: ${channelId}`);

    } catch (error) {
        console.error('Error:', error);
        await ctx.reply(`❌ حدث خطأ أثناء التوليد أو النشر: ${error.message}`);
    }
}

bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const triggers = ['تحدث عن', 'اكتب عن', 'انشر عن', 'موضوع عن', 'كلم عن'];
    let topic = '';

    for (const trigger of triggers) {
        if (text.startsWith(trigger)) {
            topic = text.slice(trigger.length).trim();
            break;
        }
    }

    if (!topic) topic = text;

    if (topic.length < 2) {
        return ctx.reply('⚠️ الرجاء تحديد موضوع واضح للكتابة عنه.');
    }

    await generateAndPost(ctx, topic);
});


// --- Vercel Handler ---
// هذه الدالة هي التي ستستدعيها Vercel عند وصول طلب جديد
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            // معالجة تحديثات تليجرام
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } else {
            // صفحة ترحيبية عند فتح الرابط في المتصفح
            res.status(200).send('Bot is running on Vercel!');
        }
    } catch (e) {
        console.error('Webhook Error:', e);
        res.status(500).send('Error');
    }
};

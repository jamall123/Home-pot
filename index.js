require('dotenv').config();
const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');

const botToken = process.env.BOT_TOKEN;
const apiKey = process.env.GROQ_API_KEY;
const channelId = process.env.CHANNEL_ID;
const adminId = process.env.ADMIN_ID;
const adminUsername = process.env.ADMIN_USERNAME;

if (!botToken || !apiKey || !channelId) {
    console.error('❌ خطأ: يرجى التأكد من ملء جميع البيانات في ملف .env');
    process.exit(1);
}

const bot = new Telegraf(botToken);
const groq = new Groq({ apiKey: apiKey });



// التأكد من أن المستخدم هو المسؤول (Admin)
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id?.toString();
    const username = ctx.from?.username;

    const isIdMatch = adminId && userId === adminId.toString();
    const isUsernameMatch = adminUsername && username && username.toLowerCase() === adminUsername.toLowerCase().replace('@', '');

    // إذا لم يتم تعيين أي منهما، اسمح للجميع (للأمان يفضل تعيين واحد على الأقل)
    // أو إذا تطابق أحدهما
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

        // صياغة الطلب للذكاء الاصطناعي
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
            model: "llama3-8b-8192", // أو أي موديل آخر متاح في Groq
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });

        const text = chatCompletion.choices[0]?.message?.content || "";

        if (!text) {
            throw new Error("لم يتم استلام أي نص من الموديل.");
        }

        // إرسال النص المولد إلى القناة
        await bot.telegram.sendMessage(channelId, text);

        // تأكيد للمستخدم
        await ctx.reply(`✅ **تم النشر بنجاح!**\nيمكنك التحقق من القناة الآن: ${channelId}`);

    } catch (error) {
        console.error('Error generating/posting:', error);
        let errorMsg = '❌ حدث خطأ غير متوقع.';
        if (typeof error.message === 'string' && error.message.includes('403')) {
            errorMsg = '❌ خطأ: البوت ليس مشرفاً (Admin) في القناة أو المعرف غير صحيح.';
        } else if (typeof error.message === 'string' && error.message.includes('API key')) {
            errorMsg = '❌ خطأ: مفتاح Groq API غير صحيح.';
        }
        await ctx.reply(`${errorMsg}\n\nالتفاصيل: ${error.message}`);
    }
}

bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();

    // كلمات مفتاحية للبدء
    const triggers = ['تحدث عن', 'اكتب عن', 'انشر عن', 'موضوع عن', 'كلم عن'];
    let topic = '';

    for (const trigger of triggers) {
        if (text.startsWith(trigger)) {
            topic = text.slice(trigger.length).trim();
            break;
        }
    }

    // إذا لم يجد كلمة مفتاحية، يمكننا اعتبار النص كاملاً هو الموضوع إذا كان قصيراً ومباشراً
    // ولكن للأمان سنطلب الكلمة المفتاحية، أو يمكننا أن نكون مرنين.
    // لنجعلها مرنة: إذا لم تبدأ بكلمة مفتاحية، نفترض أن المستخدم يريد الحديث عن هذا الشيء مباشرة.
    if (!topic) {
        topic = text;
    }

    if (topic.length < 2) {
        return ctx.reply('⚠️ الرجاء تحديد موضوع واضح للكتابة عنه.');
    }

    await generateAndPost(ctx, topic);
});

bot.launch().then(() => {
    console.log('Bot started successfully!');
}).catch((err) => {
    console.error('Failed to start bot:', err);
});

// Eanble graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

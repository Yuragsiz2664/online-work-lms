import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.NEXT_PUBLIC_APP_URL;
const ADMIN_ID = 8593654633;

async function sendTelegram(method, body) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function POST(req) {
  try {
    const update = await req.json();
    const msg = update.message;
    if (!msg) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;

    if (msg.text === '/start') {
      await sendTelegram('sendMessage', {
        chat_id: chatId,
        text: `Assalomu alaykum, ${msg.from.first_name}! 👋\n\n<b>Online Work Academy</b> o'quv platformasiga xush kelibsiz.\n\nKurslarni ko'rish va darslarni boshlash uchun quyidagi tugmani bosing 👇`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎓 O'quv platformasini ochish", web_app: { url: WEBAPP_URL } }],
          ],
        },
      });
    }

    if (msg.photo || msg.document) {
      await sendTelegram('forwardMessage', {
        chat_id: ADMIN_ID,
        from_chat_id: chatId,
        message_id: msg.message_id,
      });

      await sendTelegram('sendMessage', {
        chat_id: ADMIN_ID,
        text: `💳 <b>Yangi to'lov cheki!</b>\nO'quvchi: ${msg.from.first_name} (@${msg.from.username || 'username_yoq'})\nID: <code>${chatId}</code>\n\nTasdiqlash uchun platformadagi <b>Admin Panel</b>ga kiring.`,
        parse_mode: 'HTML',
      });

      await sendTelegram('sendMessage', {
        chat_id: chatId,
        text: "✅ Chekingiz qabul qilindi! Admin tekshirib tasdiqlashi bilan kurs darslari avtomatik ochiladi.",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: true });
  }
}

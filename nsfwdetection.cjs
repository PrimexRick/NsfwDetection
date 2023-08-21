const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const NSFWJS = require('nsfwjs');

const BOT_TOKEN = 'VISIT_BOTFATHER_ASSHOLE';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const nsfwjs = new NSFWJS();

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  const isAdmin = await bot.getChatMember(chatId, bot.botId)
    .then(member => member.status === 'administrator')
    .catch(err => {
      console.error(err);
      return false;
    });

  if (!isAdmin) {
    return; // Bot is not an admin, do nothing
  }

  if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    const fileInfo = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;

    const imageResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    const imageBuffer = Buffer.from(imageResponse.data);
    const nsfwResult = await nsfwjs.load().then(model => model.classify(imageBuffer));

    if (nsfwResult.racy > 0.5 || nsfwResult.nsfw > 0.5) {
      
      bot.deleteMessage(chatId, msg.message_id);

      const percentages = Object.keys(nsfwResult).reduce((acc, key) => {
        acc[key] = (nsfwResult[key] * 100).toFixed(2);
        return acc;
      }, {});

      bot.sendMessage(chatId, `
        NSFW content detected and deleted:
        Porn: ${percentages.porn}%
        Adult: ${percentages.adult}%
        Hentai: ${percentages.hentai}%
        Artwork: ${percentages.artwork}%
        Neutral: ${percentages.neutral}%
      `);
    }
  }
});

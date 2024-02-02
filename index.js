const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require('@discordjs/voice');
const googleTTS = require('google-tts-api');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once('ready', () => {
  console.log(`${client.user.tag} đã sẵn sàng!`);
});

client.on('messageCreate', async message => {
  // Log ra console mỗi khi nhận được tin nhắn mới
  console.log(`Nhận được tin nhắn từ ${message.author.tag}: ${message.content}`);

  // Kiểm tra xem tin nhắn có bắt đầu bằng '_s' không và người dùng có trong voice channel không
  if (!message.guild || !message.content.startsWith('_s ')) {
    return;
  }

  // Nếu người dùng không trong voice channel, gửi thông báo
  if (!message.member.voice.channel) {
    return message.reply("Vào room đi muốn gì tôi nói hộ cho, không vào mà cứ lói lói rồi kêu tôi ra");
  }

  // Lấy nội dung cần phát sau lệnh '_s'
  const text = message.content.slice(3).trim();
  if (!text.length) {
    return message.reply('Bạn cần phải cung cấp một đoạn văn để tôi có thể đọc.');
  }

  if (text.length > 200) {
    return message.reply('Dài quá là tao nằm ngất ra đây đấy, không nói nữa đâu');
  }

  const url = await googleTTS.getAudioUrl(text, {
    lang: 'vi',
    slow: false,
  });

  const voiceChannel = message.member.voice.channel;
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
  });

  const player = createAudioPlayer();
  const resource = createAudioResource(url);
  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    console.log('Hoàn thành phát!');
    // Bot sẽ ở lại trong voice channel, không tự động rời đi ngay
  });

  player.on('error', error => {
    console.error('Lỗi phát:', error);
    message.reply('Có lỗi xảy ra khi tôi cố gắng phát âm thanh.');
  });
});

client.login('MTIwMzA5NTQ2MDQzNzMwMzM2OA.G_oMpd.4sfs6QduDLurEvugnk2wr6ymWtEKM-eBll2EoM'); // Thay thế 'YOUR_BOT_TOKEN' bằng token thực của bot

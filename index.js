const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const ytdl = require('ytdl-core');

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
  client.user.setPresence({
    status: "idle",
    activities: [{ name: "Chúc Mừng Năm Mới 2024", type: ActivityType.Custom }]
  });
});

client.on('messageCreate', async message => {
  if (!message.guild) return;
  const args = message.content.split(' ').slice(1);

  switch (message.content.split(' ')[0].toLowerCase()) {
    case '_s':
      await handleTTSCommand(message, args.join(' '));
      break;
    case '_p':
      await handlePlayCommand(message, args.join(' '));
      break;
    case '_dis':
      await handleDisconnectCommand(message);
      break;
    case '_sk':
      await handleSkipCommand(message);
      break;
    case '_xoatn':
      await handleBulkDeleteCommand(message, args[0]);
      break;
    case '_tubi':
      message.reply("Hãy từ bi tha thứ cho mọi người, tết đến xuân dìa đừng đổ máu nữa 🙏");
      break;
    case '_che':
      message.reply("Sao mấy người lại chê tôi, thật là tàn ác mà 😿");
      break;
    case '_bi là ai':
      message.reply("Là Hellobine, lúc mới vào nhà Raccoon Bi khá là trầm tính nhưng về sau lại là 1 phiên bản khác, hoạt bát hơn, vui hơn nhưng kéo theo đó là sự vô tri mỗi khi tìm đường hoặc tìm hiểu tính năng của game vì thế dân gian còn gọi Bi là **Đân Bì**\n\n Câu cửa miệng: Mọe, trời ơi đừng nướng quả mọng nữa, cho thú ăn đi, nó trầm cảm thì cho đi chich");
      break;
    case '_lenh':
      message.reply("Tính Năng Hiện Có:\n\n✅ **TTS ( Text To Speech )**: Nói thay lời bạn từ văn bản, dùng lệnh _s\n✅ **Xóa Tin Nhắn**: Xóa tin nhắn với tốc độ ánh sáng, dùng lệnh _xoatn sau đó nhập số lượng.\n **🎶Play Music**: Dùng lệnh _p sau đó Link nhạc từ Youtube.\n **🤐Skip Music**: Bỏ qua bài nhạc đang hát bằng lệnh _sk\n\n *Chúc bạn chơi game vui vẻ 🥰*");
      break;
    // Xử lý các lệnh khác...
  }
});

async function handleTTSCommand(message, text) {
  if (!message.member.voice.channel) {
    return message.reply("Vào room đi muốn gì tôi nói hộ cho, không vào mà cứ lói lói rồi kêu tôi ra");
  }
  if (text.length === 0) {
    return message.reply('Bạn cần phải cung cấp một đoạn văn để tôi có thể đọc.');
  }
  if (text.length > 200) {
    return message.reply('Dài quá là tao nằm ngất ra đây đấy, không nói nữa đâu');
  }

  const url = await googleTTS.getAudioUrl(text, {
    lang: 'vi',
    slow: false,
  });
  playAudio(message.member.voice.channel, url);
}

async function handlePlayCommand(message, url) {
  if (!message.member.voice.channel) {
    return message.reply('Bạn cần phải ở trong một kênh thoại.');
  }
  if (url.length === 0) {
    return message.reply('Bạn cần phải cung cấp một URL.');
  }

  try {
    const songInfo = await ytdl.getInfo(url);
    const stream = ytdl.downloadFromInfo(songInfo, { filter: 'audioonly' });
    playAudio(message.member.voice.channel, stream);
    message.reply(`🎶 Đang bấm bài "**${songInfo.videoDetails.title}**"`);
  } catch (error) {
    console.error(`Không thể phát video này: ${error.message}`);
    message.reply('Không thể phát video này.');
  }
}

async function handleDisconnectCommand(message) {
  if (!message.member.voice.channel) {
    return message.reply('Bạn cần phải ở trong một kênh thoại.');
  }
  const connection = getVoiceConnection(message.guild.id);
  if (connection) {
    connection.destroy();
  }
}

async function handleSkipCommand(message) {
  const player = getPlayer(message.guild.id);
  if (!player) {
    return message.reply("Không có bài hát nào đang phát.");
  }
  player.stop();
message.reply(`🤐Đã ngậm mồm lại và bỏ qua bài hát vừa rồi`);
}

async function handleBulkDeleteCommand(message, amount) {
  if (!message.member.permissions.has("MANAGE_MESSAGES")) {
    return message.reply("Bạn cần có quyền quản lý tin nhắn để sử dụng lệnh này.");
  }
  const deleteCount = parseInt(amount, 10);
  if (isNaN(deleteCount) || deleteCount < 1 || deleteCount > 100) {
    return message.reply("Vui lòng cung cấp một số từ 1 đến 100 tin nhắn để xóa.");
  }
  const fetched = await message.channel.messages.fetch({ limit: deleteCount });
  message.channel.bulkDelete(fetched, true).catch(error => message.reply(`Không thể xóa tin nhắn vì: ${error}`));
}

function playAudio(voiceChannel, source) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });
  
  const player = createAudioPlayer();
  player.on('error', error => console.error(`Lỗi phát: ${error.message}`));

  let resource = createAudioResource(source);
  player.play(resource);
  connection.subscribe(player);
}

function getPlayer(guildId) {
  const connection = getVoiceConnection(guildId);
  return connection ? connection.state.subscription.player : null;
}

client.login('MTIwMzA5NTQ2MDQzNzMwMzM2OA.Gt1ieL.JBhXjFwIqWhw-tSvSgZJwX1OcWax64Jk0QprnQ'); // Thay thế 'YOUR_BOT_TOKEN' bằng token thực của bot

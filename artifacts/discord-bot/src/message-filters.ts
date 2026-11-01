import {
  EmbedBuilder,
  Message,
} from "discord.js";
import { COLORS } from "./colors.js";
import { everyonePingTracker, getGS } from "./state.js";
import { gch } from "./utils.js";

const MUSIC_FILE_PATTERN = /\.(mp3|wav|ogg|flac|m4a|aac|wma|aiff|opus)$/i;
const EMOJI_PATTERN = /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|<a?:\w+:\d+>)/gu;
const SPOILER_PATTERN = /\|\|.+?\|\|/s;

async function deleteAndWarn(message: Message, warningText: string): Promise<boolean> {
  const deleted = await message.delete().then(() => true).catch(() => false);
  if (!deleted) return false;
  const channel = message.channel as any;
  const warning = typeof channel.send === "function"
    ? await channel.send({
      content: warningText,
      allowedMentions: { parse: [] },
    }).catch(() => null)
    : null;
  if (warning) {
    const timer = setTimeout(() => warning.delete().catch(() => {}), 5_000);
    timer.unref?.();
  }
  return true;
}

function containsImageOrVideo(message: Message): boolean {
  const hasAttachment = message.attachments.some((attachment) =>
    attachment.contentType?.startsWith("image/") ||
    attachment.contentType?.startsWith("video/") ||
    /\.(png|jpe?g|gif|gifv|webp|mp4|mov|webm)$/i.test(attachment.name ?? ""),
  );
  const hasImageUrl =
    /https?:\/\/\S+\.(png|jpe?g|gif|gifv|webp|mp4|mov|webm)(?:[?#]\S*)?/i.test(message.content) ||
    /https?:\/\/(tenor\.com|giphy\.com|media\.discordapp|cdn\.discordapp)\//i.test(message.content);
  const hasEmbed = message.embeds.some((embed) => embed.image || embed.video || embed.thumbnail);
  return hasAttachment || hasImageUrl || hasEmbed;
}

function containsGif(message: Message): boolean {
  return message.attachments.some((attachment) =>
    attachment.contentType === "image/gif" || attachment.name?.toLowerCase().endsWith(".gif"),
  ) || /https?:\/\/(tenor\.com|media\.tenor\.com|giphy\.com|media\.giphy\.com|c\.tenor\.com)\//i.test(message.content)
    || /https?:\/\/\S+\.gif(?:\?[^\s]*)?(?:\s|$)/i.test(message.content);
}

async function handleEveryonePing(message: Message): Promise<boolean> {
  const state = getGS(message.guild!.id);
  if (!state.antiEveryonePingEnabled || !message.mentions.everyone) return false;

  const now = Date.now();
  const guildTracker = everyonePingTracker.get(message.guild!.id) ?? new Map<string, number[]>();
  const recent = (guildTracker.get(message.author.id) ?? []).filter((timestamp) => now - timestamp < 10_000);
  recent.push(now);
  guildTracker.set(message.author.id, recent);
  everyonePingTracker.set(message.guild!.id, guildTracker);
  if (recent.length < 3) return false;

  guildTracker.delete(message.author.id);
  await message.delete().catch(() => {});
  const member = message.member ?? await message.guild!.members.fetch(message.author.id).catch(() => null);
  let action = "Message deleted";
  if (member && state.antiEveryonePingAction === "mute") {
    await member.timeout(10 * 60_000, "Anti-@everyone ping raid protection").catch(() => {});
    action = "Deleted and timed out for 10 minutes";
  } else if (member && state.antiEveryonePingAction === "ban") {
    await member.ban({ reason: "Anti-@everyone ping raid protection", deleteMessageSeconds: 60 }).catch(() => {});
    action = "Deleted and banned";
  }

  const logChannel = gch(message.guild!, state.modLogChannelId ?? state.antinukeLogChannelId);
  await logChannel?.send({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Anti-raid: @everyone ping flood")
        .setDescription(`${message.author.tag} sent three @everyone/@here pings within 10 seconds.`)
        .addFields(
          { name: "Member", value: `${message.author} (${message.author.id})`, inline: true },
          { name: "Channel", value: `<#${message.channelId}>`, inline: true },
          { name: "Action", value: action, inline: true },
        )
        .setTimestamp(),
    ],
    allowedMentions: { parse: [] },
  }).catch(() => {});
  return true;
}

export async function handleConfiguredFilters(message: Message): Promise<boolean> {
  if (!message.guild || message.author.bot) return false;
  const state = getGS(message.guild.id);
  const bypassed = state.filterBypassUsers.has(message.author.id);

  if (state.imageBlacklist.has(message.author.id) && containsImageOrVideo(message)) {
    return deleteAndWarn(message, `${message.author} — you are not allowed to post images or videos here.`);
  }

  if (state.imageMutedRoleId && message.member?.roles.cache.has(state.imageMutedRoleId) && containsGif(message)) {
    return deleteAndWarn(message, `${message.author} — GIFs are not allowed while image-muted.`);
  }

  if (state.imageOnlyChannels.has(message.channelId) && !containsImageOrVideo(message)) {
    return deleteAndWarn(message, `${message.author} — this channel is image/video only.`);
  }

  if (await handleEveryonePing(message)) return true;

  if ((state.capsLockFilterEnabled || state.capsFilterEnabled) && message.content.length >= 10) {
    const letters = message.content.replace(/[^a-zA-Z]/g, "");
    if (letters.length >= 5) {
      const uppercase = [...letters].filter((character) => character >= "A" && character <= "Z").length;
      const percentage = (uppercase / letters.length) * 100;
      if (state.capsLockFilterEnabled && percentage >= state.capsLockThreshold) {
        return deleteAndWarn(message, `${message.author} — please don't use excessive caps lock.`);
      }
      if (state.capsFilterEnabled && !bypassed && percentage >= state.capsFilterPercent) {
        return deleteAndWarn(message, `${message.author} — please don't use excessive caps.`);
      }
    }
  }

  if (!bypassed && state.emojiFilterEnabled) {
    const matches = message.content.match(EMOJI_PATTERN) ?? [];
    if (matches.length > state.emojiFilterMax) {
      return deleteAndWarn(message, `${message.author} — too many emojis (max ${state.emojiFilterMax}).`);
    }
  }

  if (!bypassed && state.massmentionFilterEnabled) {
    const count = message.mentions.users.size + message.mentions.roles.size;
    if (count > state.massmentionFilterThreshold) {
      return deleteAndWarn(message, `${message.author} — too many mentions (max ${state.massmentionFilterThreshold}).`);
    }
  }

  if (!bypassed && state.musicFileFilterEnabled && message.attachments.size > 0) {
    if (message.attachments.some((attachment) => MUSIC_FILE_PATTERN.test(attachment.name ?? ""))) {
      return deleteAndWarn(message, `${message.author} — audio file uploads are not allowed.`);
    }
  }

  if (!bypassed && state.spoilerFilterEnabled && SPOILER_PATTERN.test(message.content)) {
    return deleteAndWarn(message, `${message.author} — spoiler tags are not allowed.`);
  }

  return false;
}

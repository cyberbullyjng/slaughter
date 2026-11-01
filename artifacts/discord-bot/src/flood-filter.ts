import { EmbedBuilder, Message, TextChannel } from "discord.js";
import { COLORS } from "./colors.js";
import { FLOOD_USER_THRESHOLD, FLOOD_WINDOW_MS } from "./constants.js";
import { normalizeText } from "./automod.js";
import { getGS } from "./state.js";
import { gch } from "./utils.js";

type FloodEntry = {
  users: Set<string>;
  messages: Message[];
  firstSeen: number;
};

const channelFloods = new Map<string, Map<string, FloodEntry>>();
const lastResponseAt = new Map<string, number>();
const SLOWMODE_SECONDS = 15;
const SLOWMODE_DURATION_MS = 2 * 60_000;

export async function handleCoordinatedFlood(message: Message): Promise<boolean> {
  if (!message.guild || !message.content) return false;
  const key = normalizeText(message.content).replace(/\s+/g, " ").trim().slice(0, 256);
  if (key.length <= 2) return false;

  const now = Date.now();
  let channelEntries = channelFloods.get(message.channelId);
  if (!channelEntries) {
    channelEntries = new Map();
    channelFloods.set(message.channelId, channelEntries);
  }
  for (const [entryKey, entry] of channelEntries) {
    if (now - entry.firstSeen > FLOOD_WINDOW_MS) channelEntries.delete(entryKey);
  }

  let entry = channelEntries.get(key);
  if (!entry) {
    entry = { users: new Set(), messages: [], firstSeen: now };
    channelEntries.set(key, entry);
  }
  entry.users.add(message.author.id);
  entry.messages.push(message);
  if (entry.users.size < FLOOD_USER_THRESHOLD) return false;

  channelEntries.delete(key);
  const channel = message.channel as TextChannel & {
    bulkDelete?: (messages: string[], filterOld?: boolean) => Promise<unknown>;
    setRateLimitPerUser?: (seconds: number, reason?: string) => Promise<unknown>;
    send?: (payload: unknown) => Promise<Message>;
  };
  if (typeof channel.bulkDelete !== "function") return false;
  const messageIds = [...new Set(entry.messages.map((item) => item.id))];
  const userCount = entry.users.size;
  const cooldownActive = now - (lastResponseAt.get(message.channelId) ?? 0) < 10_000;
  lastResponseAt.set(message.channelId, now);

  for (let index = 0; index < messageIds.length; index += 100) {
    await channel.bulkDelete(messageIds.slice(index, index + 100), true).catch(() => null);
  }

  const previousSlowmode = channel.rateLimitPerUser ?? 0;
  if (previousSlowmode < SLOWMODE_SECONDS && typeof channel.setRateLimitPerUser === "function") {
    await channel.setRateLimitPerUser(SLOWMODE_SECONDS, "Coordinated message flood detected").catch(() => {});
    const timer = setTimeout(async () => {
      const current = channel.rateLimitPerUser ?? 0;
      if (current === SLOWMODE_SECONDS) {
        await channel.setRateLimitPerUser(previousSlowmode, "Temporary flood slowmode expired").catch(() => {});
      }
    }, SLOWMODE_DURATION_MS);
    timer.unref?.();
  }

  if (!cooldownActive) {
    const warning = typeof channel.send === "function" ? await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.error)
          .setTitle("Coordinated flood detected")
          .setDescription(`${messageIds.length} duplicate messages from ${userCount} members were removed. Slowmode was enabled for 2 minutes.`)
          .setTimestamp(),
      ],
      allowedMentions: { parse: [] },
    }).catch(() => null) : null;
    if (warning) {
      const timer = setTimeout(() => warning.delete().catch(() => {}), 8_000);
      timer.unref?.();
    }

    const state = getGS(message.guild.id);
    const logChannel = gch(message.guild, state.modLogChannelId ?? state.antinukeLogChannelId);
    await logChannel?.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.error)
          .setTitle("Duplicate flood removed")
          .addFields(
            { name: "Channel", value: `<#${message.channelId}>`, inline: true },
            { name: "Members", value: String(userCount), inline: true },
            { name: "Messages", value: String(messageIds.length), inline: true },
            { name: "Content", value: `\`${key.slice(0, 500)}\`` },
          )
          .setTimestamp(),
      ],
      allowedMentions: { parse: [] },
    }).catch(() => {});
  }
  console.log(`[automod] Removed ${messageIds.length} coordinated duplicate messages in #${channel.name}.`);
  return true;
}

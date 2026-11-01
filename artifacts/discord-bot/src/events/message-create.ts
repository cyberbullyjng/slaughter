import {
  EmbedBuilder,
  Events,
  Message,
  PermissionFlagsBits,
} from "discord.js";
import client from "../client.js";
import { getGS, antiSpamTracker, spamOffenses, saveState } from "../state.js";
import { handleSecurityCommand } from "../commands.js";
import { COLORS } from "../colors.js";
import { gch } from "../utils.js";
import { handleAutomod } from "../automod.js";
import { handleConfiguredFilters } from "../message-filters.js";
import { handleCoordinatedFlood } from "../flood-filter.js";

const processing = new Set<string>();

client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;
  const state = getGS(message.guild.id);

  if (message.content.startsWith(state.prefix)) {
    const [command = "", ...args] = message.content.slice(state.prefix.length).trim().split(/\s+/);
    await handleSecurityCommand(message, command.toLowerCase(), args).catch((error) => {
      console.error("[security-command] Failed:", error);
    });
    return;
  }

  try {
    if (await handleConfiguredFilters(message)) return;
  } catch (error) {
    console.error("[filters] Configured filter failed:", error);
  }
  try {
    if (await handleAutomod(message)) return;
  } catch (error) {
    console.error("[filters] Automod failed:", error);
  }
  try {
    if (await handleCoordinatedFlood(message)) return;
  } catch (error) {
    console.error("[filters] Coordinated flood filter failed:", error);
  }

  if (!state.antiSpamEnabled || state.spamBypass.has(message.author.id)) return;
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

  const now = Date.now();
  const users = antiSpamTracker.get(message.guild.id) ?? new Map<string, number[]>();
  const recent = (users.get(message.author.id) ?? [])
    .filter((timestamp) => now - timestamp < state.antiSpamWindowMs);
  recent.push(now);
  users.set(message.author.id, recent);
  antiSpamTracker.set(message.guild.id, users);
  if (recent.length < state.antiSpamThreshold) return;

  const lockKey = `${message.guild.id}:${message.author.id}`;
  if (processing.has(lockKey)) return;
  processing.add(lockKey);
  users.delete(message.author.id);

  try {
    const member = message.member ?? await message.guild.members.fetch(message.author.id);
    const offenses = spamOffenses.get(message.guild.id) ?? new Map<string, number>();
    const offense = (offenses.get(member.id) ?? 0) + 1;
    offenses.set(member.id, offense);
    spamOffenses.set(message.guild.id, offenses);
    const durations = [30_000, 120_000, 600_000, 3_600_000];
    const timeoutMs = durations[Math.min(offense - 1, durations.length - 1)];
    await member.timeout(timeoutMs, `Anti-spam: message flood (offense ${offense})`);

    const channelMessages = await message.channel.messages.fetch({ limit: 100 }).catch(() => null);
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const spamMessages = channelMessages?.filter(
      (candidate) => candidate.author.id === member.id && candidate.createdTimestamp > cutoff,
    ).first(10) ?? [];
    await Promise.all(spamMessages.map((spamMessage) => spamMessage.delete().catch(() => {})));

    const logChannel = gch(message.guild, state.modLogChannelId ?? state.antinukeLogChannelId);
    await logChannel?.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.warning)
          .setTitle("Anti-spam action")
          .addFields(
            { name: "Member", value: `${member.user.tag} (${member.id})`, inline: true },
            { name: "Channel", value: `<#${message.channelId}>`, inline: true },
            { name: "Timeout", value: `${timeoutMs / 1000}s`, inline: true },
            { name: "Offense", value: `#${offense}`, inline: true },
          )
          .setTimestamp(),
      ],
    }).catch(() => {});
  } catch (error) {
    console.error("[antispam] Could not apply action:", error);
  } finally {
    setTimeout(() => processing.delete(lockKey), 10_000).unref();
  }
});

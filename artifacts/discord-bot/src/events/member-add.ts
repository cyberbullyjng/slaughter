import { AuditLogEvent, EmbedBuilder, Events, GuildMember } from "discord.js";
import client from "../client.js";
import { getGS, joinTracker, raidModeActive, saveState } from "../state.js";
import { getAntinukeActions } from "../state.js";
import { countRecent, punishAntinuke } from "../antinuke-utils.js";
import { gch } from "../utils.js";
import { COLORS } from "../colors.js";

async function logJoinAction(member: GuildMember, title: string, detail: string) {
  const state = getGS(member.guild.id);
  const channel = gch(member.guild, state.modLogChannelId ?? state.antinukeLogChannelId);
  if (!channel) return;
  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle(title)
        .setDescription(detail)
        .addFields({ name: "Member", value: `${member.user.tag} (${member.id})` })
        .setTimestamp(),
    ],
  }).catch(() => {});
}

async function applyRaidAction(member: GuildMember, action: "kick" | "ban" | "timeout") {
  const reason = "Anti-raid: mass join protection";
  if (action === "ban") {
    await member.ban({ reason }).catch(() => {});
  } else if (action === "timeout") {
    await member.timeout(10 * 60 * 1000, reason).catch(async () => {
      await member.kick(`${reason} (timeout failed)`).catch(() => {});
    });
  } else {
    await member.kick(reason).catch(() => {});
  }
}

client.on(Events.GuildMemberAdd, async (member) => {
  const state = getGS(member.guild.id);

  if (member.user.bot && state.antinukeEnabled) {
    try {
      const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 3 });
      const entry = logs.entries.find(
        (candidate) => candidate.target?.id === member.id && Date.now() - candidate.createdTimestamp < 10_000,
      );
      const executor = entry?.executor;
      if (executor && executor.id !== client.user?.id &&
        !state.antinukeWhitelist.has(executor.id) && !state.botWhitelist.has(member.id)) {
        const actions = getAntinukeActions(member.guild.id, executor.id);
        actions.botAdds.push(Date.now());
        if (countRecent(actions.botAdds, state.antinukeWindowMs) >= state.antinukeThresholds.botAdds) {
          await punishAntinuke(
            member.guild,
            executor.id,
            `Unauthorized bot add detected (${member.user.tag})`,
          );
        }
      }
    } catch (error) {
      console.error("[antinuke] Bot-add check failed:", error);
    }
    return;
  }
  if (member.user.bot) return;

  if (state.joinRaidProtectionEnabled) {
    const now = Date.now();
    const recent = (joinTracker.get(member.guild.id) ?? [])
      .filter((timestamp) => now - timestamp < state.joinRaidWindowMs);
    recent.push(now);
    joinTracker.set(member.guild.id, recent);
    if (recent.length >= state.joinRaidThreshold && !raidModeActive.has(member.guild.id)) {
      raidModeActive.add(member.guild.id);
      const logChannel = gch(member.guild, state.modLogChannelId ?? state.antinukeLogChannelId);
      await logChannel?.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setTitle("Raid protection activated")
            .setDescription(`${recent.length} members joined within ${state.joinRaidWindowMs / 1000} seconds. Action: ${state.raidAction}.`)
            .setTimestamp(),
        ],
      }).catch(() => {});
      setTimeout(() => raidModeActive.delete(member.guild.id), 5 * 60 * 1000).unref();
    }
    if (raidModeActive.has(member.guild.id)) {
      await applyRaidAction(member, state.raidAction);
      return;
    }
  }

  const ageDays = (Date.now() - member.user.createdTimestamp) / 86_400_000;
  if (state.antiraidNewAccountsEnabled && ageDays < state.antiraidNewAccountsAge) {
    const reason = `Antiraid: account younger than ${state.antiraidNewAccountsAge} days`;
    if (state.antiraidNewAccountsAction === "ban") {
      await member.ban({ reason }).catch(() => {});
    } else {
      await member.kick(reason).catch(() => {});
    }
    await logJoinAction(member, "New account blocked", `Account age: ${Math.floor(ageDays)} day(s).`);
    return;
  }

  if (state.antiraidDefaultPfpEnabled && !member.user.avatar) {
    if (state.antiraidDefaultPfpAction === "ban") {
      await member.ban({ reason: "Antiraid: default profile picture" }).catch(() => {});
    } else {
      await member.kick("Antiraid: default profile picture").catch(() => {});
    }
    await logJoinAction(member, "Default profile picture blocked", `Action: ${state.antiraidDefaultPfpAction}.`);
  }
});

client.on(Events.GuildCreate, (guild) => {
  getGS(guild.id);
  saveState();
});

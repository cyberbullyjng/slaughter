import { EmbedBuilder, Events } from "discord.js";
import client from "../client.js";
import { getGS } from "../state.js";
import { COLORS } from "../colors.js";
import { gch } from "../utils.js";

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const member = newState.member;
  const guild = newState.guild;
  if (!member || member.user.bot || !newState.channelId) return;

  const beganStreaming = !oldState.streaming && newState.streaming;
  const beganVideo = !oldState.selfVideo && newState.selfVideo;
  if (!beganStreaming && !beganVideo) return;

  const state = getGS(guild.id);
  if (!state.streamBlacklist.has(member.id)) return;

  await member.voice.disconnect("Streaming and camera use are restricted for this member.").catch(() => {});
  const logChannel = gch(guild, state.modLogChannelId ?? state.antinukeLogChannelId);
  await logChannel?.send({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle("Stream/camera restriction enforced")
        .addFields(
          { name: "Member", value: `${member.user.tag} (${member.id})`, inline: true },
          { name: "Channel", value: `<#${newState.channelId}>`, inline: true },
        )
        .setTimestamp(),
    ],
    allowedMentions: { parse: [] },
  }).catch(() => {});
});

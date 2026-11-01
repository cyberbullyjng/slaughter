import {
  Message,
  PermissionFlagsBits,
} from "discord.js";
import { getGS, joinTracker, raidModeActive, saveState } from "./state.js";
import { OWNER_ID, PERMANENT_WHITELIST } from "./constants.js";
import {
  refreshAntinukeRestoreSnapshot,
  restoreAllFromSnapshot,
} from "./antinuke-utils.js";
import { COLORS } from "./colors.js";

const knownCommands = new Set([
  "help", "prefix",
  "antinuke", "antinukeadmin", "whitelist", "botwl",
  "permguard", "permguardwhitelist",
  "antispam", "spambypass", "unspambypass",
  "raidprotect", "antiraid", "protectionlog",
]);

async function reply(message: Message, content: string) {
  await message.reply({ content, allowedMentions: { repliedUser: false } }).catch(() => {});
}

async function showHelp(message: Message, prefix: string) {
  await reply(message, [
    "**Protection commands**",
    `**Anti-nuke**`,
    `\`${prefix}antinuke\` · status`,
    `\`${prefix}antinuke on/off\` · enable or disable`,
    `\`${prefix}antinuke bans|kicks|channels|roles|bots <n>\` · set thresholds`,
    `\`${prefix}antinuke window <seconds>\` · set detection window`,
    `\`${prefix}antinuke restore on/off/snapshot/now\` · manage restore`,
    `\`${prefix}whitelist add/remove @member\` · \`${prefix}whitelist list\``,
    `\`${prefix}botwl add/remove @bot\` · \`${prefix}botwl list\``,
    `\`${prefix}antinukeadmin grant/revoke @member\` · \`${prefix}antinukeadmin list\``,
    `\`${prefix}permguard on/off\` · \`${prefix}permguardwhitelist add/remove/list\``,
    `**Anti-spam**`,
    `\`${prefix}antispam enable/disable\` · \`${prefix}antispam threshold <n>\` · \`${prefix}antispam window <seconds>\``,
    `\`${prefix}spambypass @member\` · \`${prefix}unspambypass @member\``,
    `**Anti-raid**`,
    `\`${prefix}raidprotect on/off/clear\` · \`${prefix}raidprotect threshold <n>\``,
    `\`${prefix}raidprotect window <seconds>\` · \`${prefix}raidprotect action kick/ban/timeout\``,
    `\`${prefix}antiraid defaultpfp on/off [kick|ban]\``,
    `\`${prefix}antiraid newaccounts on/off [days] [kick|ban]\``,
    `\`${prefix}prefix <new-prefix>\` · change the message-command prefix`,
    `\`${prefix}protectionlog #channel\` · choose the log channel`,
    "Settings require Manage Server; antinuke settings also require antinuke admin access.",
  ].join("\n"));
}

function canConfigure(message: Message): boolean {
  return message.author.id === OWNER_ID ||
    message.guild?.ownerId === message.author.id ||
    Boolean(message.member?.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member?.permissions.has(PermissionFlagsBits.Administrator));
}

function canConfigureAntinuke(message: Message): boolean {
  const state = message.guild ? getGS(message.guild.id) : null;
  return Boolean(state?.antinukeAdmins.has(message.author.id) ||
    message.guild?.ownerId === message.author.id ||
    message.member?.permissions.has(PermissionFlagsBits.Administrator));
}

function mentionedId(value?: string): string | null {
  return value?.replace(/[<@!>]/g, "").match(/^\d{16,22}$/)?.[0] ?? null;
}

function action(value: string | undefined): "kick" | "ban" | "timeout" | null {
  return value === "kick" || value === "ban" || value === "timeout" ? value : null;
}

async function updateWhitelist(
  message: Message,
  list: Set<string>,
  sub: string,
  rawId?: string,
  protectedIds: Set<string> = new Set(),
) {
  const id = mentionedId(rawId);
  if (sub === "list") {
    await reply(message, list.size ? [...list].map((item) => `<@${item}>`).join(", ") : "The list is empty.");
  } else if ((sub === "add" || sub === "remove") && id) {
    if (sub === "remove" && protectedIds.has(id)) {
      await reply(message, "That permanent protection exemption cannot be removed.");
      return;
    }
    if (sub === "add") list.add(id);
    else list.delete(id);
    saveState();
    await reply(message, `<@${id}> ${sub === "add" ? "added to" : "removed from"} the list.`);
  } else {
    await reply(message, "Use `add @member`, `remove @member`, or `list`.");
  }
}

export async function handleSecurityCommand(message: Message, command: string, args: string[]): Promise<boolean> {
  if (!knownCommands.has(command) || !message.guild) return false;
  const state = getGS(message.guild.id);
  if (command === "help") {
    await showHelp(message, state.prefix);
    return true;
  }
  if (!canConfigure(message)) {
    await reply(message, "You need Manage Server permission to change protection settings.");
    return true;
  }

  const guild = message.guild;
  const sub = args[0]?.toLowerCase();
  if ([
    "antinuke", "antinukeadmin", "whitelist", "botwl",
    "permguard", "permguardwhitelist",
  ].includes(command) && !canConfigureAntinuke(message)) {
    await reply(message, "You need antinuke admin access to change these settings.");
    return true;
  }

  switch (command) {
    case "prefix": {
      const nextPrefix = args[0]?.trim();
      if (!nextPrefix) {
        await reply(message, `Current prefix: \`${state.prefix}\`. Use \`${state.prefix}prefix <new-prefix>\` to change it.`);
      } else if (!/^[!#$%&()*+,\-.:;=?^_~|]{1,3}$/.test(nextPrefix)) {
        await reply(message, "Choose 1–3 punctuation characters (no spaces, @, or /).");
      } else {
        state.prefix = nextPrefix;
        saveState();
        await reply(message, `Prefix changed to \`${nextPrefix}\`. Use \`${nextPrefix}help\` for help.`);
      }
      return true;
    }
    case "antinuke": {
      if (sub === "on" || sub === "off") {
        state.antinukeEnabled = sub === "on";
        saveState();
        await reply(message, `Antinuke ${sub === "on" ? "enabled" : "disabled"}.`);
      } else if (sub === "window") {
        const seconds = Number(args[1]);
        if (!Number.isInteger(seconds) || seconds < 1 || seconds > 60) {
          await reply(message, "Use `antinuke window <1–60 seconds>`.");
          break;
        }
        state.antinukeWindowMs = seconds * 1000;
        saveState();
        await reply(message, `Antinuke window set to ${seconds} seconds.`);
      } else if (sub === "restore") {
        const option = args[1]?.toLowerCase();
        if (option === "on") {
          state.antinukeRestoreEnabled = true;
          await refreshAntinukeRestoreSnapshot(guild, message.author.id);
          saveState();
          await reply(message, "Automatic restore is on; a fresh snapshot was saved.");
        } else if (option === "off") {
          state.antinukeRestoreEnabled = false;
          saveState();
          await reply(message, "Automatic restore is off.");
        } else if (option === "snapshot") {
          await refreshAntinukeRestoreSnapshot(guild, message.author.id);
          saveState();
          await reply(message, "Antinuke restore snapshot refreshed.");
        } else if (option === "now") {
          const result = await restoreAllFromSnapshot(guild);
          await reply(message, `Restore finished: ${result.roles} roles, ${result.channels} channels, ${result.missing} missing.`);
        } else {
          await reply(message, "Use `antinuke restore on`, `off`, `snapshot`, or `now`.");
        }
      } else if (["bans", "kicks", "channels", "roles", "bots"].includes(sub ?? "") && args[1]) {
        const value = Number(args[1]);
        if (!Number.isInteger(value) || value < 1 || value > 100) {
          await reply(message, "Threshold must be an integer from 1 to 100.");
          break;
        }
        const key = sub === "channels" ? "channelDeletes" : sub === "roles" ? "roleDeletes" : sub === "bots" ? "botAdds" : sub;
        state.antinukeThresholds[key as keyof typeof state.antinukeThresholds] = value;
        saveState();
        await reply(message, `Antinuke ${sub} threshold set to ${value}.`);
      } else {
        await reply(message,
          `Antinuke is ${state.antinukeEnabled ? "on" : "off"}; restore is ${state.antinukeRestoreEnabled ? "on" : "off"}. ` +
          `Thresholds: bans ${state.antinukeThresholds.bans}, kicks ${state.antinukeThresholds.kicks}, ` +
          `channels ${state.antinukeThresholds.channelDeletes}, roles ${state.antinukeThresholds.roleDeletes}, ` +
          `bots ${state.antinukeThresholds.botAdds}. Use \`antinuke on/off\`, \`antinuke <bans|kicks|channels|roles|bots> N\`, or \`antinuke restore …\`.`);
      }
      return true;
    }
    case "antinukeadmin": {
      const id = mentionedId(args[1]);
      if (sub === "list") {
        await reply(message, [...state.antinukeAdmins].map((memberId) => `<@${memberId}>`).join(", ") || "No antinuke admins.");
      } else if ((sub === "grant" || sub === "revoke") && id) {
        if (sub === "grant") state.antinukeAdmins.add(id);
        else if (id !== OWNER_ID) state.antinukeAdmins.delete(id);
        saveState();
        await reply(message, `${sub === "grant" ? "Granted" : "Revoked"} antinuke access ${sub === "grant" ? "to" : "from"} <@${id}>.`);
      } else {
        await reply(message, "Use `antinukeadmin grant @member`, `revoke @member`, or `list`.");
      }
      return true;
    }
    case "whitelist":
      await updateWhitelist(message, state.antinukeWhitelist, sub ?? "", args[1], PERMANENT_WHITELIST);
      return true;
    case "botwl":
      await updateWhitelist(message, state.botWhitelist, sub ?? "", args[1]);
      return true;
    case "permguard": {
      if (sub === "on" || sub === "off") {
        state.permGuardEnabled = sub === "on";
        saveState();
      }
      await reply(message, `Permission guard is ${state.permGuardEnabled ? "on" : "off"}. Use \`permguard on/off\`.`);
      return true;
    }
    case "permguardwhitelist":
      await updateWhitelist(message, state.permGuardWhitelist, sub ?? "", args[1], PERMANENT_WHITELIST);
      return true;
    case "antispam": {
      if (sub === "enable" || sub === "disable") {
        state.antiSpamEnabled = sub === "enable";
      } else if (sub === "threshold") {
        const value = Number(args[1]);
        if (!Number.isInteger(value) || value < 2 || value > 100) {
          await reply(message, "Use an anti-spam threshold from 2 to 100.");
          return true;
        }
        state.antiSpamThreshold = value;
      } else if (sub === "window") {
        const seconds = Number(args[1]);
        if (!Number.isInteger(seconds) || seconds < 1 || seconds > 60) {
          await reply(message, "Use an anti-spam window from 1 to 60 seconds.");
          return true;
        }
        state.antiSpamWindowMs = seconds * 1000;
      }
      saveState();
      await reply(message, `Anti-spam is ${state.antiSpamEnabled ? "on" : "off"} (${state.antiSpamThreshold} messages / ${state.antiSpamWindowMs / 1000}s).`);
      return true;
    }
    case "spambypass":
    case "unspambypass": {
      const id = mentionedId(args[0]);
      if (!id) {
        await reply(message, `Use \`${state.prefix}${command} @member\`.`);
        return true;
      }
      if (command === "spambypass") state.spamBypass.add(id);
      else state.spamBypass.delete(id);
      saveState();
      await reply(message, `<@${id}> ${command === "spambypass" ? "is exempt from" : "is no longer exempt from"} anti-spam.`);
      return true;
    }
    case "raidprotect": {
      if (sub === "on" || sub === "off") {
        state.joinRaidProtectionEnabled = sub === "on";
        if (sub === "off") raidModeActive.delete(guild.id);
      } else if (sub === "clear") {
        raidModeActive.delete(guild.id);
        joinTracker.delete(guild.id);
      } else if (sub === "threshold") {
        const value = Number(args[1]);
        if (!Number.isInteger(value) || value < 2 || value > 100) {
          await reply(message, "Use a raid threshold from 2 to 100.");
          return true;
        }
        state.joinRaidThreshold = value;
      } else if (sub === "window") {
        const seconds = Number(args[1]);
        if (!Number.isInteger(seconds) || seconds < 1 || seconds > 60) {
          await reply(message, "Use a raid window from 1 to 60 seconds.");
          return true;
        }
        state.joinRaidWindowMs = seconds * 1000;
      } else if (sub === "action") {
        const selected = action(args[1]);
        if (!selected) {
          await reply(message, "Choose `kick`, `ban`, or `timeout`.");
          return true;
        }
        state.raidAction = selected;
      }
      saveState();
      await reply(message,
        `Join raid protection is ${state.joinRaidProtectionEnabled ? "on" : "off"}; ` +
        `${state.joinRaidThreshold} joins / ${state.joinRaidWindowMs / 1000}s; action: ${state.raidAction}.`);
      return true;
    }
    case "antiraid": {
      const feature = sub;
      const toggle = args[1]?.toLowerCase();
      if (feature === "defaultpfp") {
        if (toggle === "on" || toggle === "off") state.antiraidDefaultPfpEnabled = toggle === "on";
        if (args[2] === "kick" || args[2] === "ban") state.antiraidDefaultPfpAction = args[2];
        saveState();
        await reply(message, `Default-avatar protection is ${state.antiraidDefaultPfpEnabled ? "on" : "off"} (${state.antiraidDefaultPfpAction}).`);
      } else if (feature === "newaccounts") {
        if (toggle === "on" || toggle === "off") state.antiraidNewAccountsEnabled = toggle === "on";
        const days = Number(args[2]);
        if (Number.isInteger(days) && days > 0 && days <= 3650) state.antiraidNewAccountsAge = days;
        if (args[3] === "kick" || args[3] === "ban") state.antiraidNewAccountsAction = args[3];
        saveState();
        await reply(message, `New-account protection is ${state.antiraidNewAccountsEnabled ? "on" : "off"} (${state.antiraidNewAccountsAge} days, ${state.antiraidNewAccountsAction}).`);
      } else {
        await reply(message,
          `Use \`antiraid defaultpfp on/off [kick|ban]\` or \`antiraid newaccounts on/off [days] [kick|ban]\`. ` +
          `Mass joins are controlled by \`raidprotect\`.`);
      }
      return true;
    }
    case "protectionlog": {
      const channel = message.mentions.channels.first() ??
        (args[0] ? message.guild.channels.cache.get(args[0].replace(/[<#>]/g, "")) : null);
      if (!channel?.isTextBased() || channel.isDMBased()) {
        await reply(message, `Use \`${state.prefix}protectionlog #channel\`.`);
        return true;
      }
      state.antinukeLogChannelId = channel.id;
      state.modLogChannelId = channel.id;
      saveState();
      await reply(message, `Protection logs will be sent to <#${channel.id}>.`);
      return true;
    }
  }
  return false;
}

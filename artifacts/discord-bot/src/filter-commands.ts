import { Message, PermissionFlagsBits } from "discord.js";
import { OWNER_ID } from "./constants.js";
import { getGS, saveState } from "./state.js";

export const filterCommandNames = new Set([
  "antiinvite",
  "filter",
  "filterbypass",
  "unfilterbypass",
  "listbypasses",
  "linkbypass",
  "unlinkbypass",
  "linkbypasses",
  "imageonly",
  "imageban",
  "imageunban",
  "imagebans",
  "imagemutedrole",
  "streamban",
  "streamunban",
  "streambans",
  "capslockfilter",
  "antieveryoneping",
]);

async function reply(message: Message, content: string): Promise<void> {
  await message.reply({ content, allowedMentions: { repliedUser: false, parse: [] } }).catch(() => {});
}

function parseId(value?: string): string | null {
  return value?.replace(/[<@!&#>]/g, "").match(/^\d{16,22}$/)?.[0] ?? null;
}

function hasPermission(message: Message, permission: bigint): boolean {
  return message.author.id === OWNER_ID ||
    message.guild?.ownerId === message.author.id ||
    Boolean(message.member?.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member?.permissions.has(permission));
}

function hasAntinukeAdminAccess(message: Message): boolean {
  const state = message.guild ? getGS(message.guild.id) : null;
  return message.author.id === OWNER_ID ||
    message.guild?.ownerId === message.author.id ||
    Boolean(message.member?.permissions.has(PermissionFlagsBits.Administrator) ||
      state?.antinukeAdmins.has(message.author.id));
}

function describeSet(values: Set<string>, format = (value: string) => `<@${value}>`): string {
  return values.size ? [...values].map(format).join(", ") : "The list is empty.";
}

function validPercent(value: string | undefined, fallback: number): number | null {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 100 ? parsed : null;
}

export async function handleFilterCommand(
  message: Message,
  command: string,
  args: string[],
): Promise<boolean> {
  if (!filterCommandNames.has(command) || !message.guild) return false;
  const state = getGS(message.guild.id);
  const sub = args[0]?.toLowerCase();

  let requiredPermission = PermissionFlagsBits.ManageGuild;
  if (command === "linkbypass" || command === "unlinkbypass" || command === "linkbypasses") {
    requiredPermission = PermissionFlagsBits.ManageMessages;
  } else if (command === "imageonly") {
    requiredPermission = PermissionFlagsBits.ManageChannels;
  }

  if (["filterbypass", "unfilterbypass", "listbypasses"].includes(command)) {
    if (!hasAntinukeAdminAccess(message)) {
      await reply(message, "You need antinuke admin access to manage filter bypasses.");
      return true;
    }
  } else if (!hasPermission(message, requiredPermission)) {
    await reply(message, "You don't have permission to change these filter settings.");
    return true;
  }

  const idFromArg = (index = 0) => parseId(args[index]);
  const updateUserSet = async (
    set: Set<string>,
    operation: "add" | "remove",
    id: string | null,
    noun: string,
  ) => {
    if (!id) {
      await reply(message, `Use \`${state.prefix}${command} @member\`.`);
      return;
    }
    if (operation === "add") set.add(id);
    else set.delete(id);
    saveState();
    await reply(message, `<@${id}> ${operation === "add" ? "added to" : "removed from"} the ${noun} list.`);
  };

  switch (command) {
    case "antiinvite":
      if (sub === "on" || sub === "off") {
        state.inviteFilterEnabled = sub === "on";
        saveState();
      }
      await reply(message, `Invite filter is ${state.inviteFilterEnabled ? "on" : "off"}. Use \`${state.prefix}antiinvite on/off\`.`);
      return true;

    case "filter": {
      const kind = sub;
      const option = args[1]?.toLowerCase();
      if (kind === "add" || kind === "remove") {
        const word = args.slice(1).join(" ").trim().toLowerCase();
        if (!word || word.length > 80) {
          await reply(message, `Use \`${state.prefix}filter ${kind} <word or phrase>\` (up to 80 characters).`);
          return true;
        }
        if (kind === "add") state.customFilterWords.add(word);
        else state.customFilterWords.delete(word);
        saveState();
        await reply(message, `Filter term "${word}" ${kind === "add" ? "added" : "removed"}.`);
        return true;
      }
      if (kind === "list") {
        await reply(message, state.customFilterWords.size
          ? [...state.customFilterWords].map((word) => `• ${word}`).join("\n").slice(0, 1900)
          : "No custom filter terms are configured.");
        return true;
      }
      if (["caps", "emoji", "massmention", "musicfiles", "spoilers"].includes(kind ?? "")) {
        if (option !== "on" && option !== "off") {
          await reply(message, `Use \`${state.prefix}filter ${kind} on/off [limit]\`.`);
          return true;
        }
        const enabled = option === "on";
        if (kind === "caps") {
          const percent = validPercent(args[2], state.capsFilterPercent);
          if (percent === null) {
            await reply(message, "Caps percentage must be an integer from 1 to 100.");
            return true;
          }
          state.capsFilterEnabled = enabled;
          state.capsFilterPercent = percent;
        } else if (kind === "emoji") {
          const limit = args[2] === undefined ? state.emojiFilterMax : Number(args[2]);
          if (!Number.isInteger(limit) || limit < 0 || limit > 100) {
            await reply(message, "Emoji limit must be an integer from 0 to 100.");
            return true;
          }
          state.emojiFilterEnabled = enabled;
          state.emojiFilterMax = limit;
        } else if (kind === "massmention") {
          const limit = args[2] === undefined ? state.massmentionFilterThreshold : Number(args[2]);
          if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            await reply(message, "Mention limit must be an integer from 1 to 100.");
            return true;
          }
          state.massmentionFilterEnabled = enabled;
          state.massmentionFilterThreshold = limit;
        } else if (kind === "musicfiles") {
          state.musicFileFilterEnabled = enabled;
        } else {
          state.spoilerFilterEnabled = enabled;
        }
        saveState();
        await reply(message, `${kind} filter ${enabled ? "enabled" : "disabled"}.`);
        return true;
      }
      await reply(message,
        `Use \`${state.prefix}filter add/remove/list\`, or \`${state.prefix}filter caps|emoji|massmention|musicfiles|spoilers on/off [limit]\`.`);
      return true;
    }

    case "filterbypass":
    case "unfilterbypass":
      await updateUserSet(
        state.filterBypassUsers,
        command === "filterbypass" ? "add" : "remove",
        idFromArg(),
        "filter bypass",
      );
      return true;
    case "listbypasses":
      await reply(message, describeSet(state.filterBypassUsers));
      return true;

    case "linkbypass":
    case "unlinkbypass":
      await updateUserSet(
        state.linkFilterBypass,
        command === "linkbypass" ? "add" : "remove",
        idFromArg(),
        "invite-link bypass",
      );
      return true;
    case "linkbypasses":
      await reply(message, describeSet(state.linkFilterBypass));
      return true;

    case "imageonly": {
      if (sub === "list") {
        await reply(message, describeSet(state.imageOnlyChannels, (channelId) => `<#${channelId}>`));
        return true;
      }
      const channelId = parseId(args[0]) ?? message.mentions.channels.first()?.id;
      const enabled = args[1]?.toLowerCase();
      if (!channelId || (enabled !== "on" && enabled !== "off")) {
        await reply(message, `Use \`${state.prefix}imageonly #channel on/off\` or \`${state.prefix}imageonly list\`.`);
        return true;
      }
      if (enabled === "on") state.imageOnlyChannels.add(channelId);
      else state.imageOnlyChannels.delete(channelId);
      saveState();
      await reply(message, `Image/video-only mode ${enabled === "on" ? "enabled" : "disabled"} for <#${channelId}>.`);
      return true;
    }

    case "imageban":
      await updateUserSet(state.imageBlacklist, "add", idFromArg(), "image-posting restriction");
      return true;
    case "imageunban":
      await updateUserSet(state.imageBlacklist, "remove", idFromArg(), "image-posting restriction");
      return true;
    case "imagebans":
      await reply(message, describeSet(state.imageBlacklist));
      return true;
    case "imagemutedrole": {
      if (sub === "clear") {
        state.imageMutedRoleId = null;
        saveState();
        await reply(message, "Image-muted GIF filtering is disabled because no role is configured.");
        return true;
      }
      if (sub === "status") {
        await reply(message, state.imageMutedRoleId
          ? `GIF filtering applies to members with <@&${state.imageMutedRoleId}>.`
          : "No image-muted role is configured.");
        return true;
      }
      const roleId = parseId(args[0]);
      const role = roleId ? message.guild.roles.cache.get(roleId) : null;
      if (!role) {
        await reply(message, `Use \`${state.prefix}imagemutedrole @role\`, \`clear\`, or \`status\`.`);
        return true;
      }
      state.imageMutedRoleId = role.id;
      saveState();
      await reply(message, `GIF filtering applies to members with <@&${role.id}>.`);
      return true;
    }
    case "streamban":
      await updateUserSet(state.streamBlacklist, "add", idFromArg(), "stream/camera restriction");
      return true;
    case "streamunban":
      await updateUserSet(state.streamBlacklist, "remove", idFromArg(), "stream/camera restriction");
      return true;
    case "streambans":
      await reply(message, describeSet(state.streamBlacklist));
      return true;

    case "capslockfilter": {
      const option = sub;
      if (option === "on" || option === "off") {
        state.capsLockFilterEnabled = option === "on";
      } else if (option === "threshold") {
        const percent = validPercent(args[1], state.capsLockThreshold);
        if (percent === null) {
          await reply(message, "Caps-lock threshold must be an integer from 1 to 100.");
          return true;
        }
        state.capsLockThreshold = percent;
      }
      saveState();
      await reply(message,
        `Caps-lock filter is ${state.capsLockFilterEnabled ? "on" : "off"} (${state.capsLockThreshold}% threshold). ` +
        `Use \`${state.prefix}capslockfilter on/off\` or \`${state.prefix}capslockfilter threshold <1–100>\`.`);
      return true;
    }

    case "antieveryoneping": {
      if (sub === "on" || sub === "off") state.antiEveryonePingEnabled = sub === "on";
      else if (sub === "action" && (args[1] === "delete" || args[1] === "mute" || args[1] === "ban")) {
        state.antiEveryonePingAction = args[1];
      }
      saveState();
      await reply(message,
        `Anti-@everyone ping protection is ${state.antiEveryonePingEnabled ? "on" : "off"} ` +
        `(action: ${state.antiEveryonePingAction}). Use \`${state.prefix}antieveryoneping on/off\` or ` +
        `\`${state.prefix}antieveryoneping action delete/mute/ban\`.`);
      return true;
    }
  }
  return false;
}

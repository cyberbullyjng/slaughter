import {
  ChatInputCommandInteraction,
  Events,
  Message,
} from "discord.js";
import client from "../client.js";
import { handleSecurityCommand } from "../commands.js";

function resolveCommand(interaction: ChatInputCommandInteraction): { command: string; args: string[] } {
  const name = interaction.commandName;
  const options = interaction.options;
  const subcommand = options.getSubcommand(false);
  const integer = (optionName: string) => String(options.getInteger(optionName, true));
  const userId = () => options.getUser("member", true).id;

  switch (name) {
    case "help":
      return { command: "help", args: [] };
    case "prefix": {
      const value = options.getString("value");
      return { command: "prefix", args: value ? [value] : [] };
    }
    case "antinuke":
      if (!subcommand || subcommand === "status") return { command: name, args: [] };
      if (subcommand === "threshold") {
        return {
          command: name,
          args: [options.getString("kind", true), integer("count")],
        };
      }
      if (subcommand === "window") return { command: name, args: ["window", integer("seconds")] };
      if (subcommand === "restore") return { command: name, args: ["restore", options.getString("action", true)] };
      return { command: name, args: [subcommand] };
    case "antinukeadmin":
    case "whitelist":
    case "botwl":
    case "permguardwhitelist":
      return {
        command: name,
        args: subcommand === "list" ? ["list"] : [subcommand ?? "", userId()],
      };
    case "permguard":
      return { command: name, args: subcommand && subcommand !== "status" ? [subcommand] : [] };
    case "antispam":
      if (!subcommand || subcommand === "status") return { command: name, args: [] };
      if (subcommand === "threshold") return { command: name, args: ["threshold", integer("count")] };
      if (subcommand === "window") return { command: name, args: ["window", integer("seconds")] };
      return { command: name, args: [subcommand] };
    case "spambypass":
    case "unspambypass":
      return { command: name, args: [userId()] };
    case "raidprotect":
      if (!subcommand || subcommand === "status") return { command: name, args: [] };
      if (subcommand === "threshold") return { command: name, args: ["threshold", integer("count")] };
      if (subcommand === "window") return { command: name, args: ["window", integer("seconds")] };
      if (subcommand === "action") return { command: name, args: ["action", options.getString("action", true)] };
      return { command: name, args: [subcommand] };
    case "antiraid":
      if (!subcommand) return { command: name, args: [] };
      if (subcommand === "status") return { command: name, args: ["status"] };
      if (subcommand === "defaultpfp") {
        return {
          command: name,
          args: [
            "defaultpfp",
            options.getBoolean("enabled", true) ? "on" : "off",
            options.getString("action") ?? "",
          ],
        };
      }
      return {
        command: name,
        args: [
          "newaccounts",
          options.getBoolean("enabled", true) ? "on" : "off",
          options.getInteger("days") === null ? "" : String(options.getInteger("days")),
          options.getString("action") ?? "",
        ],
      };
    case "protectionlog":
      return { command: name, args: [options.getChannel("channel", true).id] };
    case "antiinvite":
      return { command: name, args: subcommand === "status" ? [] : [subcommand ?? ""] };
    case "filter": {
      if (subcommand === "add" || subcommand === "remove") {
        return { command: name, args: [subcommand, options.getString("word", true)] };
      }
      if (subcommand === "list") return { command: name, args: ["list"] };
      if (subcommand === "caps") {
        const percent = options.getInteger("percent");
        return { command: name, args: ["caps", options.getBoolean("enabled", true) ? "on" : "off", ...(percent === null ? [] : [String(percent)])] };
      }
      if (subcommand === "emoji" || subcommand === "massmention") {
        const optionName = subcommand === "emoji" ? "maximum" : "maximum";
        const maximum = options.getInteger(optionName);
        return {
          command: name,
          args: [subcommand, options.getBoolean("enabled", true) ? "on" : "off", ...(maximum === null ? [] : [String(maximum)])],
        };
      }
      if (subcommand === "musicfiles" || subcommand === "spoilers") {
        return { command: name, args: [subcommand, options.getBoolean("enabled", true) ? "on" : "off"] };
      }
      return { command: name, args: [] };
    }
    case "filterbypass":
    case "unfilterbypass":
    case "linkbypass":
    case "unlinkbypass":
    case "imageban":
    case "imageunban":
    case "streamban":
    case "streamunban":
      return { command: name, args: [userId()] };
    case "listbypasses":
    case "linkbypasses":
    case "imagebans":
    case "streambans":
      return { command: name, args: [] };
    case "imagemutedrole":
      if (subcommand === "set") return { command: name, args: [options.getRole("role", true).id] };
      return { command: name, args: subcommand === "clear" ? ["clear"] : ["status"] };
    case "imageonly":
      if (subcommand === "list") return { command: name, args: ["list"] };
      return {
        command: name,
        args: [
          options.getChannel("channel", true).id,
          options.getBoolean("enabled", true) ? "on" : "off",
        ],
      };
    case "capslockfilter":
      if (subcommand === "threshold") return { command: name, args: ["threshold", integer("percent")] };
      return { command: name, args: subcommand && subcommand !== "status" ? [subcommand] : [] };
    case "antieveryoneping":
      if (subcommand === "action") return { command: name, args: ["action", options.getString("action", true)] };
      return { command: name, args: subcommand && subcommand !== "status" ? [subcommand] : [] };
    default:
      return { command: name, args: [] };
  }
}

function toMessageAdapter(interaction: ChatInputCommandInteraction): Message {
  const guild = interaction.guild!;
  const adapter = {
    guild,
    author: interaction.user,
    member: {
      permissions: {
        has: (permission: any) => interaction.memberPermissions?.has(permission) ?? false,
      },
    },
    mentions: {
      channels: {
        first: () => interaction.commandName === "protectionlog"
          ? interaction.options.getChannel("channel")
          : null,
      },
    },
    reply: async (payload: { content: string }) =>
      interaction.editReply({ content: payload.content, allowedMentions: { parse: [] } }),
  };
  return adapter as unknown as Message;
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) {
    await interaction.reply({ content: "Use this command in a server.", ephemeral: true }).catch(() => {});
    return;
  }

  const route = resolveCommand(interaction);
  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (error) {
    console.error("[slash-command] Could not acknowledge interaction:", error);
    return;
  }
  try {
    await handleSecurityCommand(toMessageAdapter(interaction), route.command, route.args);
  } catch (error) {
    console.error("[slash-command] Failed:", error);
    await interaction.editReply("The command failed. Check the bot logs for details.").catch(() => {});
  }
});

import { ChannelType, SlashCommandBuilder } from "discord.js";

const addOrRemoveUser = (builder: any) =>
  builder.addUserOption((option: any) => option
    .setName("member")
    .setDescription("Member to change")
    .setRequired(true));

export const protectionSlashCommands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show the bot's protection and filter commands"),

  new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Show or change the message-command prefix")
    .addStringOption((option) => option
      .setName("value")
      .setDescription("New prefix (one to three punctuation characters)")
      .setMinLength(1)
      .setMaxLength(3)
      .setRequired(false)),

  new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Configure anti-nuke protection")
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show protection status"))
    .addSubcommand((subcommand) => subcommand.setName("on").setDescription("Enable anti-nuke"))
    .addSubcommand((subcommand) => subcommand.setName("off").setDescription("Disable anti-nuke"))
    .addSubcommand((subcommand) => subcommand
      .setName("window")
      .setDescription("Set the detection window")
      .addIntegerOption((option) => option.setName("seconds").setDescription("1–60 seconds").setMinValue(1).setMaxValue(60).setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName("threshold")
      .setDescription("Set an action threshold")
      .addStringOption((option) => option
        .setName("kind")
        .setDescription("Action to count")
        .setRequired(true)
        .addChoices(
          { name: "Bans", value: "bans" },
          { name: "Kicks", value: "kicks" },
          { name: "Channel deletions", value: "channels" },
          { name: "Role deletions", value: "roles" },
          { name: "Bot additions", value: "bots" },
        ))
      .addIntegerOption((option) => option.setName("count").setDescription("Threshold (1–100)").setMinValue(1).setMaxValue(100).setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName("restore")
      .setDescription("Manage automatic restore and snapshots")
      .addStringOption((option) => option
        .setName("action")
        .setDescription("Restore action")
        .setRequired(true)
        .addChoices(
          { name: "Enable and take snapshot", value: "on" },
          { name: "Disable", value: "off" },
          { name: "Refresh snapshot", value: "snapshot" },
          { name: "Restore now", value: "now" },
        ))),

  new SlashCommandBuilder()
    .setName("antinukeadmin")
    .setDescription("Manage anti-nuke administrators")
    .addSubcommand((subcommand) => addOrRemoveUser(subcommand.setName("grant").setDescription("Grant anti-nuke access")))
    .addSubcommand((subcommand) => addOrRemoveUser(subcommand.setName("revoke").setDescription("Revoke anti-nuke access")))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List anti-nuke administrators")),

  new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Manage the anti-nuke member whitelist")
    .addSubcommand((subcommand) => addOrRemoveUser(subcommand.setName("add").setDescription("Add a member")))
    .addSubcommand((subcommand) => addOrRemoveUser(subcommand.setName("remove").setDescription("Remove a member")))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List exempt members")),

  new SlashCommandBuilder()
    .setName("botwl")
    .setDescription("Manage the anti-nuke bot whitelist")
    .addSubcommand((subcommand) => addOrRemoveUser(subcommand.setName("add").setDescription("Allow a bot")))
    .addSubcommand((subcommand) => addOrRemoveUser(subcommand.setName("remove").setDescription("Remove a bot")))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List allowed bots")),

  new SlashCommandBuilder()
    .setName("permguard")
    .setDescription("Prevent unauthorized administrator-role assignments")
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show permission guard status"))
    .addSubcommand((subcommand) => subcommand.setName("on").setDescription("Enable permission guard"))
    .addSubcommand((subcommand) => subcommand.setName("off").setDescription("Disable permission guard")),

  new SlashCommandBuilder()
    .setName("permguardwhitelist")
    .setDescription("Manage permission guard exemptions")
    .addSubcommand((subcommand) => addOrRemoveUser(subcommand.setName("add").setDescription("Allow a member")))
    .addSubcommand((subcommand) => addOrRemoveUser(subcommand.setName("remove").setDescription("Remove a member")))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List exempt members")),

  new SlashCommandBuilder()
    .setName("antispam")
    .setDescription("Configure message flood protection")
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show anti-spam settings"))
    .addSubcommand((subcommand) => subcommand.setName("enable").setDescription("Enable anti-spam"))
    .addSubcommand((subcommand) => subcommand.setName("disable").setDescription("Disable anti-spam"))
    .addSubcommand((subcommand) => subcommand
      .setName("threshold")
      .setDescription("Set the message count threshold")
      .addIntegerOption((option) => option.setName("count").setDescription("2–100 messages").setMinValue(2).setMaxValue(100).setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName("window")
      .setDescription("Set the detection window")
      .addIntegerOption((option) => option.setName("seconds").setDescription("1–60 seconds").setMinValue(1).setMaxValue(60).setRequired(true))),

  new SlashCommandBuilder()
    .setName("spambypass")
    .setDescription("Exempt a member from anti-spam")
    .addUserOption((option) => option.setName("member").setDescription("Member to exempt").setRequired(true)),

  new SlashCommandBuilder()
    .setName("unspambypass")
    .setDescription("Remove a member's anti-spam exemption")
    .addUserOption((option) => option.setName("member").setDescription("Member to unexempt").setRequired(true)),

  new SlashCommandBuilder()
    .setName("raidprotect")
    .setDescription("Configure mass-join raid protection")
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show raid protection settings"))
    .addSubcommand((subcommand) => subcommand.setName("on").setDescription("Enable raid protection"))
    .addSubcommand((subcommand) => subcommand.setName("off").setDescription("Disable raid protection"))
    .addSubcommand((subcommand) => subcommand.setName("clear").setDescription("Clear active raid mode"))
    .addSubcommand((subcommand) => subcommand
      .setName("threshold")
      .setDescription("Set the number of joins")
      .addIntegerOption((option) => option.setName("count").setDescription("2–100 joins").setMinValue(2).setMaxValue(100).setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName("window")
      .setDescription("Set the join window")
      .addIntegerOption((option) => option.setName("seconds").setDescription("1–60 seconds").setMinValue(1).setMaxValue(60).setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName("action")
      .setDescription("Choose how to handle raiders")
      .addStringOption((option) => option
        .setName("action")
        .setDescription("Action to take")
        .setRequired(true)
        .addChoices(
          { name: "Kick", value: "kick" },
          { name: "Ban", value: "ban" },
          { name: "Timeout", value: "timeout" },
        ))),

  new SlashCommandBuilder()
    .setName("antiraid")
    .setDescription("Configure account and profile raid checks")
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show anti-raid settings"))
    .addSubcommand((subcommand) => subcommand
      .setName("defaultpfp")
      .setDescription("Set the response to default profile pictures")
      .addBooleanOption((option) => option.setName("enabled").setDescription("Enable the check").setRequired(true))
      .addStringOption((option) => option
        .setName("action")
        .setDescription("Action to take")
        .setRequired(false)
        .addChoices({ name: "Kick", value: "kick" }, { name: "Ban", value: "ban" })))
    .addSubcommand((subcommand) => subcommand
      .setName("newaccounts")
      .setDescription("Set the response to newly created accounts")
      .addBooleanOption((option) => option.setName("enabled").setDescription("Enable the check").setRequired(true))
      .addIntegerOption((option) => option.setName("days").setDescription("Minimum account age (days)").setMinValue(1).setMaxValue(3650).setRequired(false))
      .addStringOption((option) => option
        .setName("action")
        .setDescription("Action to take")
        .setRequired(false)
        .addChoices({ name: "Kick", value: "kick" }, { name: "Ban", value: "ban" }))),

  new SlashCommandBuilder()
    .setName("protectionlog")
    .setDescription("Choose where protection events are logged")
    .addChannelOption((option) => option
      .setName("channel")
      .setDescription("Text channel for protection logs")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName("antiinvite")
    .setDescription("Configure the invite-link filter")
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show invite filter status"))
    .addSubcommand((subcommand) => subcommand.setName("on").setDescription("Enable invite filtering"))
    .addSubcommand((subcommand) => subcommand.setName("off").setDescription("Disable invite filtering")),

  new SlashCommandBuilder()
    .setName("filter")
    .setDescription("Configure content filters")
    .addSubcommand((subcommand) => subcommand
      .setName("add")
      .setDescription("Add a custom blocked word or phrase")
      .addStringOption((option) => option.setName("word").setDescription("Word or phrase").setMaxLength(80).setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName("remove")
      .setDescription("Remove a custom blocked word or phrase")
      .addStringOption((option) => option.setName("word").setDescription("Word or phrase").setMaxLength(80).setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List custom blocked terms"))
    .addSubcommand((subcommand) => subcommand
      .setName("caps")
      .setDescription("Configure the caps filter")
      .addBooleanOption((option) => option.setName("enabled").setDescription("Enable this filter").setRequired(true))
      .addIntegerOption((option) => option.setName("percent").setDescription("Uppercase threshold (1–100)").setMinValue(1).setMaxValue(100)))
    .addSubcommand((subcommand) => subcommand
      .setName("emoji")
      .setDescription("Configure the emoji limit")
      .addBooleanOption((option) => option.setName("enabled").setDescription("Enable this filter").setRequired(true))
      .addIntegerOption((option) => option.setName("maximum").setDescription("Maximum emoji per message").setMinValue(0).setMaxValue(100)))
    .addSubcommand((subcommand) => subcommand
      .setName("massmention")
      .setDescription("Configure the mention limit")
      .addBooleanOption((option) => option.setName("enabled").setDescription("Enable this filter").setRequired(true))
      .addIntegerOption((option) => option.setName("maximum").setDescription("Maximum mentions per message").setMinValue(1).setMaxValue(100)))
    .addSubcommand((subcommand) => subcommand
      .setName("musicfiles")
      .setDescription("Enable or disable music file filtering")
      .addBooleanOption((option) => option.setName("enabled").setDescription("Enable this filter").setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName("spoilers")
      .setDescription("Enable or disable spoiler filtering")
      .addBooleanOption((option) => option.setName("enabled").setDescription("Enable this filter").setRequired(true))),

  new SlashCommandBuilder()
    .setName("filterbypass")
    .setDescription("Exempt a member from content filters")
    .addUserOption((option) => option.setName("member").setDescription("Member to exempt").setRequired(true)),

  new SlashCommandBuilder()
    .setName("unfilterbypass")
    .setDescription("Remove a member's content-filter exemption")
    .addUserOption((option) => option.setName("member").setDescription("Member to unexempt").setRequired(true)),

  new SlashCommandBuilder()
    .setName("listbypasses")
    .setDescription("List content-filter exemptions"),

  new SlashCommandBuilder()
    .setName("linkbypass")
    .setDescription("Allow a member to post invite links")
    .addUserOption((option) => option.setName("member").setDescription("Member to allow").setRequired(true)),

  new SlashCommandBuilder()
    .setName("unlinkbypass")
    .setDescription("Remove a member's invite-link exemption")
    .addUserOption((option) => option.setName("member").setDescription("Member to remove").setRequired(true)),

  new SlashCommandBuilder()
    .setName("linkbypasses")
    .setDescription("List invite-link exemptions"),

  new SlashCommandBuilder()
    .setName("imageonly")
    .setDescription("Configure image/video-only channels")
    .addSubcommand((subcommand) => subcommand
      .setName("set")
      .setDescription("Enable or disable image-only mode")
      .addChannelOption((option) => option.setName("channel").setDescription("Channel to change").setRequired(true))
      .addBooleanOption((option) => option.setName("enabled").setDescription("Enable image-only mode").setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List image-only channels")),

  new SlashCommandBuilder()
    .setName("imageban")
    .setDescription("Stop a member from posting images or videos")
    .addUserOption((option) => option.setName("member").setDescription("Member to restrict").setRequired(true)),

  new SlashCommandBuilder()
    .setName("imageunban")
    .setDescription("Allow a member to post images and videos")
    .addUserOption((option) => option.setName("member").setDescription("Member to unrestrict").setRequired(true)),

  new SlashCommandBuilder()
    .setName("imagebans")
    .setDescription("List image-posting restrictions"),

  new SlashCommandBuilder()
    .setName("imagemutedrole")
    .setDescription("Configure the role subject to the GIF filter")
    .addSubcommand((subcommand) => subcommand
      .setName("set")
      .setDescription("Set the image-muted role")
      .addRoleOption((option) => option.setName("role").setDescription("Role to filter").setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName("clear").setDescription("Clear the configured role"))
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show the configured role")),

  new SlashCommandBuilder()
    .setName("streamban")
    .setDescription("Stop a member from streaming or using camera")
    .addUserOption((option) => option.setName("member").setDescription("Member to restrict").setRequired(true)),

  new SlashCommandBuilder()
    .setName("streamunban")
    .setDescription("Allow a member to stream or use camera")
    .addUserOption((option) => option.setName("member").setDescription("Member to unrestrict").setRequired(true)),

  new SlashCommandBuilder()
    .setName("streambans")
    .setDescription("List stream and camera restrictions"),

  new SlashCommandBuilder()
    .setName("capslockfilter")
    .setDescription("Configure caps-lock filtering")
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show caps-lock filter status"))
    .addSubcommand((subcommand) => subcommand.setName("on").setDescription("Enable caps-lock filtering"))
    .addSubcommand((subcommand) => subcommand.setName("off").setDescription("Disable caps-lock filtering"))
    .addSubcommand((subcommand) => subcommand
      .setName("threshold")
      .setDescription("Set the uppercase threshold")
      .addIntegerOption((option) => option.setName("percent").setDescription("1–100 percent").setMinValue(1).setMaxValue(100).setRequired(true))),

  new SlashCommandBuilder()
    .setName("antieveryoneping")
    .setDescription("Configure repeated @everyone/@here protection")
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show protection status"))
    .addSubcommand((subcommand) => subcommand.setName("on").setDescription("Enable protection"))
    .addSubcommand((subcommand) => subcommand.setName("off").setDescription("Disable protection"))
    .addSubcommand((subcommand) => subcommand
      .setName("action")
      .setDescription("Choose the action after repeated pings")
      .addStringOption((option) => option
        .setName("action")
        .setDescription("Response to the ping raid")
        .setRequired(true)
        .addChoices(
          { name: "Delete message", value: "delete" },
          { name: "Timeout member", value: "mute" },
          { name: "Ban member", value: "ban" },
        ))),
].map((command) => command.toJSON());


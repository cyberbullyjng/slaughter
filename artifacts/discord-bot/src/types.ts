export interface BackupRole {
  id: string;
  name: string;
  color: number;
  permissions: string;
  position: number;
  hoist: boolean;
  mentionable: boolean;
}

export interface BackupOverwrite {
  id: string;
  type: 0 | 1;
  allow: string;
  deny: string;
}

export interface BackupChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  topic: string | null;
  nsfw: boolean;
  rateLimitPerUser: number;
  parentId: string | null;
  overwrites: BackupOverwrite[];
  bitrate?: number;
  userLimit?: number;
}

export interface ServerBackup {
  id: string;
  createdAt: number;
  createdBy: string;
  guildName: string;
  memberCount: number;
  roles: BackupRole[];
  categories: BackupChannel[];
  channels: BackupChannel[];
}

export interface AntinukeActions {
  bans: number[];
  kicks: number[];
  channelDeletes: number[];
  roleDeletes: number[];
  botAdds: number[];
}

export interface GuildState {
  prefix: string;
  antinukeEnabled: boolean;
  antinukeRestoreEnabled: boolean;
  antinukeWindowMs: number;
  antinukeThresholds: {
    bans: number;
    kicks: number;
    channelDeletes: number;
    roleDeletes: number;
    botAdds: number;
  };
  antinukeWhitelist: Set<string>;
  botWhitelist: Set<string>;
  antinukeAdmins: Set<string>;
  permGuardEnabled: boolean;
  permGuardWhitelist: Set<string>;
  antinukeActions: Map<string, AntinukeActions>;
  antinukeLogChannelId: string | null;
  modLogChannelId: string | null;
  backups: Map<string, ServerBackup>;

  inviteFilterEnabled: boolean;
  customFilterWords: Set<string>;
  filterBypassUsers: Set<string>;
  linkFilterBypass: Set<string>;
  imageOnlyChannels: Set<string>;
  imageBlacklist: Set<string>;
  streamBlacklist: Set<string>;
  imageMutedRoleId: string | null;
  antiEveryonePingEnabled: boolean;
  antiEveryonePingAction: "delete" | "mute" | "ban";
  capsLockFilterEnabled: boolean;
  capsLockThreshold: number;
  capsFilterEnabled: boolean;
  capsFilterPercent: number;
  emojiFilterEnabled: boolean;
  emojiFilterMax: number;
  massmentionFilterEnabled: boolean;
  massmentionFilterThreshold: number;
  musicFileFilterEnabled: boolean;
  spoilerFilterEnabled: boolean;

  antiSpamEnabled: boolean;
  antiSpamThreshold: number;
  antiSpamWindowMs: number;
  spamBypass: Set<string>;

  joinRaidProtectionEnabled: boolean;
  joinRaidThreshold: number;
  joinRaidWindowMs: number;
  raidAction: "kick" | "ban" | "timeout";
  antiraidDefaultPfpEnabled: boolean;
  antiraidDefaultPfpAction: "kick" | "ban";
  antiraidNewAccountsEnabled: boolean;
  antiraidNewAccountsAge: number;
  antiraidNewAccountsAction: "kick" | "ban";
}

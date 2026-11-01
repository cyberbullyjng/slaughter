import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OWNER_ID, PERMANENT_WHITELIST } from "./constants.js";
import type { AntinukeActions, GuildState, ServerBackup } from "./types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const stateFile = path.resolve(here, "..", "security-state.json");
const legacyStateFile = path.resolve(here, "..", "state.json");
export const guildStates = new Map<string, GuildState>();
export const antiSpamTracker = new Map<string, Map<string, number[]>>();
export const spamOffenses = new Map<string, Map<string, number>>();
export const joinTracker = new Map<string, number[]>();
export const raidModeActive = new Set<string>();
export const everyonePingTracker = new Map<string, Map<string, number[]>>();
export const filterDmCooldown = new Map<string, number>();

function defaults(): GuildState {
  return {
    prefix: ",",
    antinukeEnabled: true,
    antinukeRestoreEnabled: true,
    antinukeWindowMs: ANTINUKE_DEFAULT_WINDOW,
    antinukeThresholds: { bans: 3, kicks: 3, channelDeletes: 2, roleDeletes: 2, botAdds: 1 },
    antinukeWhitelist: new Set(PERMANENT_WHITELIST),
    botWhitelist: new Set(),
    antinukeAdmins: new Set(OWNER_ID ? [OWNER_ID] : []),
    permGuardEnabled: false,
    permGuardWhitelist: new Set(PERMANENT_WHITELIST),
    antinukeActions: new Map(),
    antinukeLogChannelId: null,
    modLogChannelId: null,
    backups: new Map(),
    inviteFilterEnabled: true,
    customFilterWords: new Set(),
    filterBypassUsers: new Set(),
    linkFilterBypass: new Set(),
    imageOnlyChannels: new Set(),
    imageBlacklist: new Set(),
    streamBlacklist: new Set(),
    imageMutedRoleId: null,
    antiEveryonePingEnabled: false,
    antiEveryonePingAction: "delete",
    capsLockFilterEnabled: false,
    capsLockThreshold: 70,
    capsFilterEnabled: false,
    capsFilterPercent: 70,
    emojiFilterEnabled: false,
    emojiFilterMax: 10,
    massmentionFilterEnabled: false,
    massmentionFilterThreshold: 5,
    musicFileFilterEnabled: false,
    spoilerFilterEnabled: false,
    antiSpamEnabled: true,
    antiSpamThreshold: 5,
    antiSpamWindowMs: 5_000,
    spamBypass: new Set(),
    joinRaidProtectionEnabled: false,
    joinRaidThreshold: 8,
    joinRaidWindowMs: 10_000,
    raidAction: "kick",
    antiraidDefaultPfpEnabled: false,
    antiraidDefaultPfpAction: "kick",
    antiraidNewAccountsEnabled: false,
    antiraidNewAccountsAge: 7,
    antiraidNewAccountsAction: "kick",
  };
}

const ANTINUKE_DEFAULT_WINDOW = 5_000;

export function getGS(guildId: string): GuildState {
  let state = guildStates.get(guildId);
  if (!state) {
    state = defaults();
    guildStates.set(guildId, state);
  }
  return state;
}

function asSet<T = string>(value: unknown): Set<T> {
  return new Set(Array.isArray(value) ? value as T[] : []);
}

function asMap<K = string, V = unknown>(value: unknown): Map<K, V> {
  return new Map(Array.isArray(value) ? value as [K, V][] : []);
}

function hydrate(guildId: string, raw: Record<string, any>) {
  const state = defaults();
  const old = raw ?? {};
  state.prefix = typeof old.prefix === "string" ? old.prefix : state.prefix;
  state.antinukeEnabled = typeof old.antinukeEnabled === "boolean" ? old.antinukeEnabled : state.antinukeEnabled;
  state.antinukeRestoreEnabled = typeof old.antinukeRestoreEnabled === "boolean" ? old.antinukeRestoreEnabled : state.antinukeRestoreEnabled;
  state.antinukeWindowMs = numberValue(old.antinukeWindowMs, state.antinukeWindowMs);
  state.antinukeThresholds = { ...state.antinukeThresholds, ...(old.antinukeThresholds ?? {}) };
  state.antinukeWhitelist = new Set([...state.antinukeWhitelist, ...asSet(old.antinukeWhitelist)]);
  state.botWhitelist = asSet(old.botWhitelist);
  state.antinukeAdmins = new Set([...state.antinukeAdmins, ...asSet(old.antinukeAdmins)]);
  state.permGuardEnabled = old.permGuardEnabled === true;
  state.permGuardWhitelist = new Set([...state.permGuardWhitelist, ...asSet(old.permGuardWhitelist)]);
  state.antinukeActions = asMap<string, AntinukeActions>(old.antinukeActions);
  state.antinukeLogChannelId = old.antinukeLogChannelId ?? old.automodLogChannelId ?? null;
  state.modLogChannelId = old.modLogChannelId ?? old.automodLogChannelId ?? null;
  state.backups = asMap<string, ServerBackup>(old.backups);
  state.inviteFilterEnabled = typeof old.inviteFilterEnabled === "boolean" ? old.inviteFilterEnabled : state.inviteFilterEnabled;
  state.customFilterWords = asSet(old.customFilterWords);
  state.filterBypassUsers = asSet(old.filterBypassUsers);
  state.linkFilterBypass = asSet(old.linkFilterBypass);
  state.imageOnlyChannels = asSet(old.imageOnlyChannels);
  state.imageBlacklist = asSet(old.imageBlacklist);
  state.streamBlacklist = asSet(old.streamBlacklist);
  state.imageMutedRoleId = typeof old.imageMutedRoleId === "string" ? old.imageMutedRoleId : null;
  state.antiEveryonePingEnabled = old.antiEveryonePingEnabled === true;
  state.antiEveryonePingAction = old.antiEveryonePingAction === "mute" || old.antiEveryonePingAction === "ban"
    ? old.antiEveryonePingAction
    : "delete";
  state.capsLockFilterEnabled = old.capsLockFilterEnabled === true;
  state.capsLockThreshold = numberValue(old.capsLockThreshold, state.capsLockThreshold);
  state.capsFilterEnabled = old.capsFilterEnabled === true;
  state.capsFilterPercent = numberValue(old.capsFilterPercent, state.capsFilterPercent);
  state.emojiFilterEnabled = old.emojiFilterEnabled === true;
  state.emojiFilterMax = numberValue(old.emojiFilterMax, state.emojiFilterMax);
  state.massmentionFilterEnabled = old.massmentionFilterEnabled === true;
  state.massmentionFilterThreshold = numberValue(old.massmentionFilterThreshold, state.massmentionFilterThreshold);
  state.musicFileFilterEnabled = old.musicFileFilterEnabled === true;
  state.spoilerFilterEnabled = old.spoilerFilterEnabled === true;
  state.antiSpamEnabled = typeof old.antiSpamEnabled === "boolean" ? old.antiSpamEnabled : state.antiSpamEnabled;
  state.antiSpamThreshold = numberValue(old.antiSpamThreshold, state.antiSpamThreshold);
  state.antiSpamWindowMs = numberValue(old.antiSpamWindowMs, state.antiSpamWindowMs);
  state.spamBypass = asSet(old.spamBypass);
  state.joinRaidProtectionEnabled = old.joinRaidProtectionEnabled === true;
  state.joinRaidThreshold = numberValue(old.joinRaidThreshold, state.joinRaidThreshold);
  state.joinRaidWindowMs = numberValue(old.joinRaidWindowMs, state.joinRaidWindowMs);
  state.raidAction = old.raidAction === "ban" || old.raidAction === "timeout" ? old.raidAction : "kick";
  state.antiraidDefaultPfpEnabled = old.antiraidDefaultPfpEnabled === true;
  state.antiraidDefaultPfpAction = old.antiraidDefaultPfpAction === "ban" ? "ban" : "kick";
  state.antiraidNewAccountsEnabled = old.antiraidNewAccountsEnabled === true;
  state.antiraidNewAccountsAge = numberValue(old.antiraidNewAccountsAge, state.antiraidNewAccountsAge);
  state.antiraidNewAccountsAction = old.antiraidNewAccountsAction === "ban" ? "ban" : "kick";
  guildStates.set(guildId, state);
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function loadPersistedState(): void {
  try {
    const current = fs.existsSync(stateFile)
      ? JSON.parse(fs.readFileSync(stateFile, "utf8")) as Record<string, Record<string, any>>
      : {};
    const legacy = fs.existsSync(legacyStateFile)
      ? JSON.parse(fs.readFileSync(legacyStateFile, "utf8")) as Record<string, Record<string, any>>
      : {};
    const guildIds = new Set([...Object.keys(legacy), ...Object.keys(current)]);
    for (const guildId of guildIds) {
      if (guildId === "_global") continue;
      hydrate(guildId, { ...(legacy[guildId] ?? {}), ...(current[guildId] ?? {}) });
    }
  } catch (error) {
    console.error("[state] Could not load saved protection settings:", error);
  }
}

export function saveState(): void {
  const serialized: Record<string, Record<string, unknown>> = {};
  for (const [guildId, state] of guildStates) {
    serialized[guildId] = {
      ...state,
      antinukeWhitelist: [...state.antinukeWhitelist],
      botWhitelist: [...state.botWhitelist],
      antinukeAdmins: [...state.antinukeAdmins],
      permGuardWhitelist: [...state.permGuardWhitelist],
      antinukeActions: [...state.antinukeActions],
      backups: [...state.backups],
      customFilterWords: [...state.customFilterWords],
      filterBypassUsers: [...state.filterBypassUsers],
      linkFilterBypass: [...state.linkFilterBypass],
      imageOnlyChannels: [...state.imageOnlyChannels],
      imageBlacklist: [...state.imageBlacklist],
      streamBlacklist: [...state.streamBlacklist],
      spamBypass: [...state.spamBypass],
    };
  }
  const tempFile = `${stateFile}.tmp`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(serialized), "utf8");
    fs.renameSync(tempFile, stateFile);
  } catch (error) {
    console.error("[state] Could not save protection settings:", error);
    try { fs.unlinkSync(tempFile); } catch {}
  }
}

export function getAntinukeActions(guildId: string, userId: string): AntinukeActions {
  const state = getGS(guildId);
  let actions = state.antinukeActions.get(userId);
  if (!actions) {
    actions = { bans: [], kicks: [], channelDeletes: [], roleDeletes: [], botAdds: [] };
    state.antinukeActions.set(userId, actions);
  }
  return actions;
}

export function cleanupCaches(): void {
  const now = Date.now();
  for (const [guildId, users] of everyonePingTracker) {
    for (const [userId, timestamps] of users) {
      const recent = timestamps.filter((timestamp) => now - timestamp < 10_000);
      if (recent.length) users.set(userId, recent);
      else users.delete(userId);
    }
    if (!users.size) everyonePingTracker.delete(guildId);
  }
  for (const [userId, timestamp] of filterDmCooldown) {
    if (now - timestamp > 60 * 60 * 1_000) filterDmCooldown.delete(userId);
  }
  for (const [guildId, users] of antiSpamTracker) {
    const state = getGS(guildId);
    for (const [userId, timestamps] of users) {
      const recent = timestamps.filter((timestamp) => now - timestamp < state.antiSpamWindowMs);
      if (recent.length) users.set(userId, recent);
      else users.delete(userId);
    }
    if (!users.size) antiSpamTracker.delete(guildId);
  }
  for (const [guildId, timestamps] of joinTracker) {
    const recent = timestamps.filter((timestamp) => now - timestamp < getGS(guildId).joinRaidWindowMs);
    if (recent.length) joinTracker.set(guildId, recent);
    else joinTracker.delete(guildId);
  }
  for (const [guildId, users] of spamOffenses) {
    if (!users.size) spamOffenses.delete(guildId);
  }
  for (const state of guildStates.values()) {
    for (const [userId, actions] of state.antinukeActions) {
      for (const key of Object.keys(actions) as (keyof AntinukeActions)[]) {
        actions[key] = actions[key].filter((timestamp) => now - timestamp < state.antinukeWindowMs);
      }
      if (Object.values(actions).every((entries) => entries.length === 0)) state.antinukeActions.delete(userId);
    }
  }
}

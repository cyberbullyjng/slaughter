export const TOKEN = process.env.BOT_TOKEN;
export const OWNER_ID = process.env.BOT_OWNER_ID ?? "1497981895990837359";
export const PERMANENT_WHITELIST = new Set([
  OWNER_ID,
  "1488367906336276511",
  ...(process.env.PERMANENT_WHITELIST_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
].filter(Boolean));
export const ANTINUKE_WINDOW_MS = 5_000;
export const MASS_MENTION_THRESHOLD = 5;
export const FILTER_DM_COOLDOWN_MS = 5 * 60 * 1_000;
export const FLOOD_USER_THRESHOLD = 4;
export const FLOOD_WINDOW_MS = 10_000;

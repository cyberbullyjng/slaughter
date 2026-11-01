import { EmbedBuilder, Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { BLOCKED_PATTERNS, BLOCKED_TERMS } from "./wordlist.js";
import { FILTER_DM_COOLDOWN_MS, MASS_MENTION_THRESHOLD } from "./constants.js";
import { filterDmCooldown, getGS } from "./state.js";
import { COLORS } from "./colors.js";
import { gch } from "./utils.js";

const characterMap: Record<string, string> = {
  "а": "a", "А": "a", "е": "e", "Е": "e", "о": "o", "О": "o",
  "р": "p", "Р": "p", "с": "c", "С": "c", "х": "x", "Х": "x",
  "і": "i", "І": "i", "у": "u", "У": "u", "т": "t", "Т": "t",
  "к": "k", "К": "k", "м": "m", "М": "m", "н": "n", "Н": "n",
  "в": "b", "В": "b", "Ь": "b", "α": "a", "Α": "a", "ε": "e", "Ε": "e",
  "ο": "o", "Ο": "o", "ν": "n", "Ν": "n", "η": "n", "Η": "n", "ρ": "p",
  "Ρ": "p", "τ": "t", "Τ": "t", "κ": "k", "Κ": "k", "χ": "x", "Χ": "x",
  "ι": "i", "Ι": "i", "υ": "u", "Υ": "u", "μ": "m", "Μ": "m", "σ": "s", "Σ": "s",
  "@": "a", "4": "a", "3": "e", "!": "i", "1": "i", "|": "i", "0": "o",
  "(": "o", ")": "o", "5": "s", "$": "s", "7": "t", "+": "t", "8": "b",
  "6": "g", "9": "g", "2": "z", "ʷ": "w",
};
const characterMapPattern = /[аАеЕоОрРсСхХіІуУтТкКмМнНвВЬαΑεΕοΟνΝηΗρΡτΤκΚχΧιΙυΥμΜσΣ@43!1|0()5$7+8692ʷ]/g;

export function normalizeText(text: string): string {
  return text
    .replace(/\|\||(\*\*)|__|~~|`/g, "")
    .replace(/[\u200B-\u200D\u2060\u2028\u2029\uFEFF\u00AD\u00A0]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(characterMapPattern, (character) => characterMap[character] ?? character)
    .replace(/ph/gi, "f")
    .toLowerCase();
}

type CompiledTerm = {
  label: string;
  boundary: RegExp;
  collapsedBoundary: RegExp | null;
};

function compileTerm(term: string): CompiledTerm {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundary = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
  const collapsed = normalizeText(term).replace(/[^a-z]/g, "");
  const collapsedBoundary = collapsed.length >= 5
    ? new RegExp(`(^|[^a-z])${collapsed}([^a-z]|$)`, "i")
    : null;
  return { label: term, boundary, collapsedBoundary };
}

const compiledBlockedTerms = BLOCKED_TERMS.map(compileTerm);
const customWordCache = new WeakMap<Set<string>, { size: number; compiled: CompiledTerm[] }>();

function compiledCustomWords(words: Set<string>): CompiledTerm[] {
  if (words.size === 0) return [];
  const cached = customWordCache.get(words);
  if (cached?.size === words.size) return cached.compiled;
  const compiled = [...words].map(compileTerm);
  customWordCache.set(words, { size: words.size, compiled });
  return compiled;
}

export function containsBlockedContent(text: string, customWords?: Set<string>): string | null {
  const normalized = normalizeText(text);
  const original = text.toLowerCase();
  const collapsed = normalized.replace(/[^a-z]/g, "");

  for (const { label, boundary, collapsedBoundary } of compiledBlockedTerms) {
    if (boundary.test(normalized) || boundary.test(original) || collapsedBoundary?.test(collapsed)) return label;
  }
  for (const { regex, label } of BLOCKED_PATTERNS) {
    if (regex.test(normalized) || regex.test(original) || regex.test(collapsed)) return label;
  }
  if (customWords) {
    for (const { label, boundary, collapsedBoundary } of compiledCustomWords(customWords)) {
      if (boundary.test(normalized) || boundary.test(original) || collapsedBoundary?.test(collapsed)) return label;
    }
  }
  return null;
}

const inviteCache = new Map<string, { guildId: string | null; timestamp: number }>();
const INVITE_CACHE_TTL = 5 * 60_000;

async function logRemoval(message: Message, title: string, matched: string, color: number) {
  const logChannel = gch(message.guild!, getGS(message.guild!.id).modLogChannelId ?? getGS(message.guild!.id).antinukeLogChannelId);
  await logChannel?.send({
    embeds: [
      new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .addFields(
          { name: "Member", value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: "Channel", value: `${message.channel}`, inline: true },
          { name: "Matched", value: matched.slice(0, 200), inline: true },
          { name: "Message", value: message.content.slice(0, 900) || "*empty*" },
        )
        .setTimestamp(),
    ],
    allowedMentions: { parse: [] },
  }).catch(() => {});
}

export async function handleAutomod(message: Message): Promise<boolean> {
  if (!message.guild || !message.content) return false;
  const state = getGS(message.guild.id);
  if (state.filterBypassUsers.has(message.author.id)) return false;

  const inviteMatch = /discord(?:\.gg|(?:app)?\.com\/invite)\/([\w-]+)/i;
  if (
    state.inviteFilterEnabled &&
    !state.antinukeWhitelist.has(message.author.id) &&
    !state.linkFilterBypass.has(message.author.id) &&
    !message.member?.permissions.has(PermissionFlagsBits.ManageMessages)
  ) {
    const rawMatch = inviteMatch.exec(message.content);
    const normalizedMatch = rawMatch ? null : inviteMatch.exec(normalizeText(message.content));
    const inviteCode = (rawMatch ?? normalizedMatch)?.[1];
    if (inviteCode) {
      let resolvedGuildId: string | null = null;
      const cached = inviteCache.get(inviteCode);
      if (cached && Date.now() - cached.timestamp < INVITE_CACHE_TTL) {
        resolvedGuildId = cached.guildId;
      } else {
        try {
          resolvedGuildId = (await message.client.fetchInvite(inviteCode)).guild?.id ?? null;
        } catch {}
        inviteCache.set(inviteCode, { guildId: resolvedGuildId, timestamp: Date.now() });
        if (inviteCache.size > 500) {
          const oldest = inviteCache.keys().next().value;
          if (oldest) inviteCache.delete(oldest);
        }
      }
      if (resolvedGuildId !== message.guild.id) {
        const deleted = await message.delete().then(() => true).catch(() => false);
        await message.author.send(`Invite links are not allowed in **${message.guild.name}**.`).catch(() => {});
        if (deleted) await logRemoval(message, "Invite link blocked", `discord.gg/${inviteCode}`, COLORS.warning);
        return deleted;
      }
    }
  }

  const mentionCount = message.mentions.users.size + message.mentions.roles.size;
  if (mentionCount >= MASS_MENTION_THRESHOLD) {
    const deleted = await message.delete().then(() => true).catch(() => false);
    if (deleted) await logRemoval(message, "Mass mention blocked", `${mentionCount} mentions`, COLORS.error);
    return deleted;
  }

  const newlineCount = (message.content.match(/\n/g) ?? []).length;
  if (newlineCount >= 15) {
    const deleted = await message.delete().then(() => true).catch(() => false);
    if (deleted) await logRemoval(message, "Newline flood blocked", `${newlineCount} newlines`, COLORS.warning);
    return deleted;
  }

  if (message.content.length >= 30) {
    const singleCharacterFlood = /(.)\1{19,}/.test(message.content);
    const repeatedPatternFlood = /(.{2,6})\1{6,}/.test(message.content);
    const stripped = message.content.replace(/\s/g, "");
    const frequency = new Map<string, number>();
    for (const character of stripped) frequency.set(character, (frequency.get(character) ?? 0) + 1);
    const maximum = Math.max(0, ...frequency.values());
    if (singleCharacterFlood || repeatedPatternFlood || (stripped.length >= 20 && maximum / stripped.length >= 0.75)) {
      const deleted = await message.delete().then(() => true).catch(() => false);
      if (deleted) await logRemoval(message, "Character-repeat flood blocked", "Repeated characters or pattern", COLORS.warning);
      return deleted;
    }
  }

  if (message.content.length >= 50) {
    const words = message.content.toLowerCase().split(/\s+/).filter((word) => word.length >= 3);
    const wordCounts = new Map<string, number>();
    for (const word of words) wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    const maximum = Math.max(0, ...wordCounts.values());
    if (words.length >= 8 && maximum / words.length >= 0.55) {
      const deleted = await message.delete().then(() => true).catch(() => false);
      if (deleted) await logRemoval(message, "Copy-paste flood blocked", "Repeated words", COLORS.warning);
      return deleted;
    }
  }

  const matched = containsBlockedContent(message.content, state.customFilterWords);
  if (!matched) return false;
  const deleted = await message.delete().then(() => true).catch(() => false);
  if (!deleted) return false;

  const now = Date.now();
  const shouldDm = now - (filterDmCooldown.get(message.author.id) ?? 0) > FILTER_DM_COOLDOWN_MS;
  if (shouldDm) {
    filterDmCooldown.set(message.author.id, now);
    await message.author.send(`Your message in **${message.guild.name}** was removed by the content filter.`).catch(() => {});
  }
  await logRemoval(message, "Blocked content removed", matched, COLORS.error);
  console.log(`[automod] Removed a blocked message from ${message.author.tag} in #${(message.channel as TextChannel).name}.`);
  return true;
}

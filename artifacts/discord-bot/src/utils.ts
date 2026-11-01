import {
  Guild,
  GuildMember,
  TextChannel,
} from "discord.js";

export function gch(guild: Guild, id: string | null): TextChannel | null {
  if (!id) return null;
  const channel = guild.channels.cache.get(id);
  if (!channel?.isTextBased() || channel.isDMBased() || !("send" in channel)) return null;
  return channel as TextChannel;
}

export async function fetchMember(guild: Guild, userId: string): Promise<GuildMember> {
  return guild.members.fetch(userId);
}

export async function rQueue<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  delayMs = 100,
): Promise<void> {
  for (const [index, item] of items.entries()) {
    await fn(item);
    if (delayMs > 0 && index < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

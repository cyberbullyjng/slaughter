import { Events } from "discord.js";
import client from "../client.js";
import { getGS } from "../state.js";
import { refreshAntinukeRestoreSnapshot } from "../antinuke-utils.js";
import { protectionSlashCommands } from "../slash-commands.js";

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`[security-bot] Ready as ${readyClient.user.tag}`);
  try {
    const registered = await readyClient.application.commands.set(protectionSlashCommands);
    console.log(`[slash] Registered ${registered.size} protection command(s).`);
  } catch (error) {
    console.error("[slash] Could not register protection commands:", error);
  }

  let snapshots = 0;
  for (const guild of client.guilds.cache.values()) {
    const state = getGS(guild.id);
    if (!state.antinukeRestoreEnabled) continue;
    try {
      await refreshAntinukeRestoreSnapshot(guild);
      snapshots++;
    } catch (error) {
      console.error(`[antinuke] Could not snapshot ${guild.id}:`, error);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  console.log(`[antinuke] Refreshed restore snapshots for ${snapshots} server(s).`);
});

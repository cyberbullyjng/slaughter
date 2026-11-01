import { Events } from "discord.js";
import client from "./client.js";
import { TOKEN } from "./constants.js";
import { cleanupCaches, loadPersistedState } from "./state.js";

import "./events/message-create.js";
import "./events/member-add.js";
import "./events/antinuke-events.js";
import "./events/ready.js";
import "./events/interactions.js";
import "./events/voice-state.js";

if (!TOKEN) {
  throw new Error("BOT_TOKEN is required to start the Discord security bot.");
}

loadPersistedState();
setInterval(cleanupCaches, 60_000).unref();

client.on(Events.Error, (error) => console.error("[discord] Error:", error));

process.on("unhandledRejection", (reason) => {
  console.error("[discord] Unhandled promise rejection:", reason);
});

await client.login(TOKEN);

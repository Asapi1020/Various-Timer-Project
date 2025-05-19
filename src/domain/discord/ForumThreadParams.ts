import type { Payload } from "@asp1020/discord-webhook-client";

export interface ForumThreadParams {
	payload: Payload;
	webhookUrl: string;
	threadID: string;
}

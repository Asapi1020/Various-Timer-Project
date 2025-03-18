import type { Payload } from "./Payload";

export interface ForumThreadParams {
	payload: Payload;
	webhookUrl: string;
	threadID: string;
}

import type { Discord } from "../domain";
import type { ForumThreadParams } from "../domain/discord";

export class DiscordWebhookClient {
	public async alertToForumThread(params: ForumThreadParams): Promise<boolean> {
		return await this.sendMessage(
			`${params.webhookUrl}?thread_id=${params.threadID}`,
			params.payload,
		);
	}

	public async sendMessage(
		webhookUrl: string,
		payload: Discord.Payload,
	): Promise<boolean> {
		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		return response.ok;
	}
}

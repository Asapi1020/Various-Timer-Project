import type { Discord } from "../domain";

export class DiscordWebhookClient {
	constructor(private earthquakeWebhook: string) {
		this.earthquakeWebhook = earthquakeWebhook;
	}

	public async alertEarthquake(payload: Discord.Payload): Promise<boolean> {
		return await this.sendMessage(this.earthquakeWebhook, payload);
	}

	private async sendMessage(
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

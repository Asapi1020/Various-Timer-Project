import type { Discord } from "../domain";

export class DiscordWebhookClient {
	constructor(
		private earthquakeWebhook: string,
		private workshopWebhook: string,
		private workshopUploadThreadID: string,
		private workshopUpdateThreadID: string,
	) {
		this.earthquakeWebhook = earthquakeWebhook;
		this.workshopWebhook = workshopWebhook;
	}

	public async alertEarthquake(payload: Discord.Payload): Promise<boolean> {
		return await this.sendMessage(this.earthquakeWebhook, payload);
	}

	public async alertWorkshopUpload(payload: Discord.Payload): Promise<boolean> {
		return this.alertWorkshop(payload, this.workshopUploadThreadID);
	}

	public async alertWorkshopUpdate(payload: Discord.Payload): Promise<boolean> {
		return this.alertWorkshop(payload, this.workshopUpdateThreadID);
	}

	private async alertWorkshop(
		payload: Discord.Payload,
		threadID: string,
	): Promise<boolean> {
		return await this.sendMessage(
			`${this.workshopWebhook}?thread_id=${threadID}`,
			payload,
		);
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

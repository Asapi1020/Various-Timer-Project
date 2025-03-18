import type { Discord, Workshop } from "../domain";
import type { WorkshopProps } from "../domain/discord";
import type { DiscordWebhookClient } from "../infra";
import type { WorkshopRepository } from "../infra/WorkshopRepository";

export class WorkshopUsecase {
	constructor(
		private workshopRepository: WorkshopRepository,
		private discordWebhookClient: DiscordWebhookClient,
	) {
		this.workshopRepository = workshopRepository;
		this.discordWebhookClient = discordWebhookClient;
	}

	async getWorkshopData(
		appID: number,
		sort: "lastUploaded" | "lastUpdated",
	): Promise<Workshop.BasicData[]> {
		return await this.workshopRepository.getWorkshopData(appID, sort);
	}

	async getWorkshopDetail(link: string): Promise<Workshop.DetailData> {
		return await this.workshopRepository.getWorkshopDetail(link);
	}

	async checkWorkshop(props: WorkshopProps): Promise<Date> {
		const basicData = await this.getWorkshopData(props.appID, "lastUpdated");
		const data: Workshop.Data[] = [];
		for (const datum of basicData) {
			try {
				const detail = await this.getWorkshopDetail(datum.link);
				if (
					(detail.updatedAt ?? detail.postedAt).getTime() <=
					props.lastAlerted.getTime()
				) {
					break;
				}
				data.push({ ...datum, ...detail });
			} catch (error) {
				console.error(error);
			}
		}

		const dataSorted = data.sort(
			(a, b) =>
				(b.updatedAt ?? b.postedAt).getTime() -
				(a.updatedAt ?? a.postedAt).getTime(),
		);

		let latestTime = props.lastAlerted;
		for (const datum of dataSorted) {
			const time = datum.updatedAt ?? datum.postedAt;

			const payload: Discord.Payload = {
				embeds: [
					{
						title: datum.title,
						description: datum.description,
						author: { name: datum.author.name, url: datum.author.link }, // TODO: author icon
						url: datum.link,
						thumbnail: { url: datum.thumbnail },
						image: { url: datum.preview },
						color: 0x0024c4,
						timestamp: time.toISOString(),
					},
				],
			};

			const threadID = datum.updatedAt
				? props.lastUpdatedThreadID
				: props.lastUploadedThreadID;

			const isSuccess = await this.discordWebhookClient
				.alertToForumThread({
					payload,
					webhookUrl: props.webhookUrl,
					threadID,
				})
				.catch(() => false);
			if (!isSuccess) {
				break;
			}
			latestTime = time;
		}
		return latestTime;
	}
}

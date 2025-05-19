import { type Payload, sendForumThreadMessage } from "@asp1020/discord-webhook-client";
import type { Workshop } from "../domain";
import type { WorkshopProps } from "../domain/discord";
import type { WorkshopRepository } from "../infra/WorkshopRepository";

export class WorkshopUsecase {
	constructor(private workshopRepository: WorkshopRepository) {
		this.workshopRepository = workshopRepository;
	}

	async getWorkshopData(appID: number, sort: "lastUploaded" | "lastUpdated"): Promise<Workshop.BasicData[]> {
		return await this.workshopRepository.getWorkshopData(appID, sort);
	}

	async getWorkshopDetail(link: string): Promise<Workshop.DetailData> {
		return await this.workshopRepository.getWorkshopDetail(link);
	}

	async checkWorkshop(props: WorkshopProps): Promise<Date> {
		console.log(props);
		const uploadedData = await this.getCompleteData(props.appID, "lastUploaded", props.lastAlerted);
		const updatedData = await this.getCompleteData(props.appID, "lastUpdated", props.lastAlerted);
		const filteredUpdatedData = updatedData.filter((datum) => !uploadedData.some((d) => d.link === datum.link));
		const data = [...uploadedData, ...filteredUpdatedData];

		const dataSorted = data.sort(
			(a, b) => (a.updatedAt ?? a.postedAt).getTime() - (b.updatedAt ?? b.postedAt).getTime(),
		);

		let latestTime = props.lastAlerted;
		for (const datum of dataSorted) {
			const isFirstUpload = datum.postedAt.getTime() > props.lastAlerted.getTime();
			const time = isFirstUpload ? datum.postedAt : (datum.updatedAt ?? datum.postedAt);

			const payload: Payload = {
				embeds: [
					{
						title: datum.title,
						description: datum.description,
						author: {
							name: datum.author.name,
							url: datum.author.link,
							icon_url: datum.authorAvatar,
						},
						url: datum.link,
						thumbnail: { url: datum.thumbnail },
						image: datum.preview ? { url: datum.preview } : undefined,
						color: 0x0024c4,
						timestamp: time.toISOString(),
					},
				],
			};

			const threadID = isFirstUpload ? props.lastUploadedThreadID : props.lastUpdatedThreadID;

			const isSuccess = await sendForumThreadMessage(props.webhookUrl, threadID, payload).catch(() => false);
			if (!isSuccess) {
				break;
			}
			latestTime = time;
		}
		return latestTime;
	}

	private async getCompleteData(
		appID: number,
		sort: "lastUploaded" | "lastUpdated",
		lastAlerted: Date,
	): Promise<Workshop.Data[]> {
		const basicData = await this.getWorkshopData(appID, sort);

		const data: Workshop.Data[] = [];
		for (const datum of basicData) {
			try {
				const detail = await this.getWorkshopDetail(datum.link);
				if ((sort === "lastUploaded" ? detail.postedAt : detail.updatedAt).getTime() <= lastAlerted.getTime()) {
					break;
				}
				data.push({ ...datum, ...detail });
			} catch (error) {
				console.error(error);
			}
		}
		return data;
	}
}

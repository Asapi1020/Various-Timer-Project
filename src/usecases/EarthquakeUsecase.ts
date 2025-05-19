import { type Payload, sendMessage } from "@asp1020/discord-webhook-client";
import type { Earthquake } from "../domain";
import type { EarthquakeRepository } from "../infra";

export class EarthquakeUsecase {
	constructor(private earthquakeRepository: EarthquakeRepository) {
		this.earthquakeRepository = earthquakeRepository;
	}

	async getEarthquakeData(): Promise<Earthquake.Data[] | null> {
		return await this.earthquakeRepository.getEarthquakeData();
	}

	async alertEarthquake(lastAlerted: Date, webhookUrl: string): Promise<Date> {
		const data = await this.earthquakeRepository.getEarthquakeData();
		const dataToAlert = data.filter((datum) => datum.time.getTime() > lastAlerted.getTime());
		if (dataToAlert.length === 0) {
			return lastAlerted;
		}

		const dataToAlertSorted = dataToAlert.sort((a, b) => a.time.getTime() - b.time.getTime());

		let latestTime = lastAlerted;
		for (const datum of dataToAlertSorted) {
			const image = await this.earthquakeRepository.getEarthquakeImage(datum.link);
			if (image === null) {
				break;
			}

			const intensityNumber = Number.parseInt(datum.seismicIntensity.match(/\d+/)?.[0] || "0", 10);
			if (intensityNumber < 4) {
				latestTime = datum.time;
				break;
			}

			const payload: Payload = {
				embeds: [
					{
						title: "地震情報",
						description: `震源地：${datum.epicenter}\n最大震度：${datum.seismicIntensity}\nマグニチュード：${datum.magnitude}`,
						author: { name: "Yahoo!天気・災害" },
						url: datum.link,
						color: 0xf8e71c,
						timestamp: datum.time.toISOString(),
						image: { url: image },
					},
				],
			};
			const isSuccess = await sendMessage(webhookUrl, payload);
			if (!isSuccess) {
				break;
			}
			latestTime = datum.time;
		}
		return latestTime;
	}
}

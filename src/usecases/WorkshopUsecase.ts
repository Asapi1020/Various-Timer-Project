import type { Workshop } from "../domain";
import type { WorkshopRepository } from "../infra/WorkshopRepository";

export class WorkshopUsecase {
	constructor(private workshopRepository: WorkshopRepository) {
		this.workshopRepository = workshopRepository;
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
}

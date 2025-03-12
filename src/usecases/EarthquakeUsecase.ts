import type { EarthquakeRepository } from "../infra";

export class EarthquakeUsecase {
	constructor(private earthquakeRepository: EarthquakeRepository) {
		this.earthquakeRepository = earthquakeRepository;
	}

	async getEarthquakeData() {
		return this.earthquakeRepository.getEarthquakeData();
	}
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EarthquakeRepository } from "../../src/infra";
import { EarthquakeUsecase } from "../../src/usecases";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
	try {
		const earthquakeRepository = new EarthquakeRepository();
		const earthquakeUsecase = new EarthquakeUsecase(earthquakeRepository);
		const data = await earthquakeUsecase.getEarthquakeData();
		res.status(200).json({ data });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

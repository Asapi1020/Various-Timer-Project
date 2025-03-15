import type { VercelRequest, VercelResponse } from "@vercel/node";
import { WorkshopRepository } from "../../src/infra";
import { WorkshopUsecase } from "../../src/usecases";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const { appID, sort } = req.query;
		const appIDNum = Number(appID);
		if (
			Number.isNaN(appIDNum) ||
			(sort !== "lastUploaded" && sort !== "lastUpdated")
		) {
			throw new Error("Invalid query parameters");
		}
		const workshopRepository = new WorkshopRepository();
		const workshopUsecase = new WorkshopUsecase(workshopRepository);
		const data = await workshopUsecase.getWorkshopData(appIDNum, sort);
		res.status(200).json({ data });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { WorkshopRepository } from "../../src/infra";
import { toWorkshopProps } from "../../src/interface-adapters/workshop";
import { WorkshopUsecase } from "../../src/usecases";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const props = toWorkshopProps(req.query);
		const workshopRepository = new WorkshopRepository();
		const workshopUsecase = new WorkshopUsecase(workshopRepository);
		const data = await workshopUsecase.checkWorkshop(props);
		res.status(200).json({ data });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { DiscordWebhookClient, WorkshopRepository } from "../../src/infra";
import { toWorkshopProps } from "../../src/interface-adapters/workshop/Controller";
import { WorkshopUsecase } from "../../src/usecases";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const props = toWorkshopProps(req.query);
		const workshopRepository = new WorkshopRepository();
		const discordWebhookClient = new DiscordWebhookClient();
		const workshopUsecase = new WorkshopUsecase(
			workshopRepository,
			discordWebhookClient,
		);
		const data = await workshopUsecase.checkWorkshop(props);
		res.status(200).json({ data });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

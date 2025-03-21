import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EarthquakeRepository } from "../../src/infra";
import { EarthquakeUsecase } from "../../src/usecases";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader?.split("Bearer ")[1];
		if (!token || token !== process.env.EARTHQUAKE_API_TOKEN) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const { lastAlerted } = req.query; // UTC date string
		const lastAlertedDate =
			typeof lastAlerted === "string" ? new Date(lastAlerted) : new Date();
		if (Number.isNaN(lastAlertedDate.getTime())) {
			throw new Error("lastAlerted is not a valid date");
		}
		const webhookUrl = process.env.EARTHQUAKE_WEBHOOK_URL;
		if (!webhookUrl) {
			throw new Error("Webhook URL is not set");
		}

		const earthquakeRepository = new EarthquakeRepository();
		const earthquakeUsecase = new EarthquakeUsecase(earthquakeRepository);

		const data = await earthquakeUsecase.alertEarthquake(
			lastAlertedDate,
			webhookUrl,
		);
		res.status(200).json({ data });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

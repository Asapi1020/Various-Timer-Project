import { toString as convertToString, isObject, toNumber } from "@asp1020/type-utils";
import type { Discord } from "../../domain";

export const toWorkshopProps = (query: unknown): Discord.WorkshopProps => {
	if (!isObject(query)) {
		throw new Error("Invalid argument type");
	}
	const appID = toNumber(query.appID);
	const lastAlerted = new Date(convertToString(query.lastAlerted));
	const webhookUrl = convertToString(query.webhookUrl);
	const lastUpdatedThreadID = convertToString(query.lastUpdatedThreadID);
	const lastUploadedThreadID = convertToString(query.lastUploadedThreadID);
	if (!appID || !lastAlerted || !webhookUrl || !lastUpdatedThreadID || !lastUploadedThreadID) {
		throw new Error("Invalid argument value");
	}

	return {
		appID,
		lastAlerted,
		webhookUrl: decodeURI(webhookUrl),
		lastUpdatedThreadID,
		lastUploadedThreadID,
	};
};

import { DateTime } from "luxon";
import TurndownService from "turndown";
import type { Workshop } from "../../domain";

export const toWorkshopBasicData = (
	title: string,
	link: string,
	thumbnail: string,
	authorLink: string,
	authorName: string,
): Workshop.BasicData => {
	if (
		typeof title !== "string" ||
		typeof link !== "string" ||
		typeof thumbnail !== "string" ||
		typeof authorLink !== "string" ||
		typeof authorName !== "string"
	) {
		throw new Error("Invalid argument type");
	}

	return {
		title,
		link,
		thumbnail,
		author: {
			name: authorName,
			link: authorLink,
		},
	};
};

export const toWorkshopDetailData = (
	preview: string,
	descriptionHTML: string,
	posted: string,
	updated?: string,
): Workshop.DetailData => {
	if (typeof preview !== "string" || typeof descriptionHTML !== "string") {
		throw new Error("Invalid argument type");
	}

	const description = new TurndownService().turndown(descriptionHTML);
	const postedAt = convertTime(posted);
	const updatedAt = updated ? convertTime(updated) : undefined;

	return {
		preview,
		description: descriptionHTML,
		postedAt,
		updatedAt,
	};
};

const convertTime = (time: string): Date => {
	const formattedTime = time.replace("@", "").trim();
	const date = DateTime.fromFormat(formattedTime, "d LLL h:mma", {
		zone: "UTC",
	});
	return date.toJSDate();
};

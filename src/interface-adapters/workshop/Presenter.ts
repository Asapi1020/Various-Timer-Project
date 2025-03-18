import {
	toString as convertToString,
	isDate,
	isString,
} from "@asp1020/type-utils";
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
		!isString(title) ||
		!isString(link) ||
		!isString(thumbnail) ||
		!isString(authorLink) ||
		!isString(authorName)
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
1;

export const toWorkshopDetailData = (
	preview: string,
	descriptionHTML: string,
	posted: string,
	updated?: string,
	authorAvatar?: string,
): Workshop.DetailData => {
	const turndownService = new TurndownService();
	turndownService.addRule("no-link-to-text", {
		filter: ["a"],
		replacement: (_content, node) => {
			const href = node.getAttribute("href");
			const text = node.textContent;
			return href === text ? text : `[${text}](${href})`;
		},
	});
	const description = isString(descriptionHTML)
		? turndownService.turndown(descriptionHTML)
		: "";
	const postedAt = convertTime(posted);
	const updatedAt = convertTime(updated);
	if (!isDate(postedAt)) {
		console.error(postedAt);
		throw new Error("Invalid argument type");
	}

	return {
		preview: convertToString(preview),
		description,
		postedAt,
		updatedAt,
		authorAvatar: convertToString(authorAvatar),
	};
};

const convertTime = (time: string): Date => {
	if (!isString(time)) {
		return null;
	}

	const formatter = time.includes(",") ? "d LLL yyyy h:mma" : "d LLL h:mma";
	const formattedTime = time
		.replace("@", "")
		.replace(",", "")
		.trim()
		.toUpperCase();
	const normalizedTime = formattedTime.replace(/\s+/g, " ");
	const date = DateTime.fromFormat(normalizedTime, formatter, {
		zone: "UTC",
	});
	return date.toJSDate();
};

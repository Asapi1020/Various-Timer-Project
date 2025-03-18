import * as cheerio from "cheerio";
import type { Workshop } from "../domain";
import {
	toWorkshopBasicData,
	toWorkshopDetailData,
} from "../interface-adapters/workshop";

export class WorkshopRepository {
	private workshopUrl = "https://steamcommunity.com/workshop/browse/";

	async getWorkshopData(
		appID: number,
		sort: "lastUploaded" | "lastUpdated",
	): Promise<Workshop.BasicData[]> {
		const sortQuery =
			sort === "lastUpdated"
				? "&browsesort=lastupdated&actualsort=lastupdated"
				: "&browsesort=mostrecent&section=readytouseitems";
		const response = await fetch(
			`${this.workshopUrl}?appid=${appID}${sortQuery}&p=1`,
		);
		const html = await response.text();
		const $ = cheerio.load(html);

		const itemPanels = $("div.workshopBrowseItems div.workshopItem").toArray();
		const items = itemPanels.map((el) => {
			const element = $(el);
			const itemLink = element.find("a.ugc").attr("href");
			const thumbnail = element
				.find("img.workshopItemPreviewImage")
				.attr("src");
			const title = element.find("div.workshopItemTitle").text().trim();
			const authorLink = element.find("a.workshop_author_link").attr("href");
			const authorName = element.find("a.workshop_author_link").text().trim();

			const data = toWorkshopBasicData(
				title,
				itemLink,
				thumbnail,
				authorLink,
				authorName,
			);
			return data;
		});
		return items;
	}

	async getWorkshopDetail(link: string): Promise<Workshop.DetailData> {
		const response = await fetch(link);
		const html = await response.text();
		const $ = cheerio.load(html);

		const preview = $("img#previewImage").attr("src");
		const detailsBlock = $("div.rightDetailsBlock");
		const header = detailsBlock
			.find("div.detailsStatLeft")
			.toArray()
			.map((el) => {
				const element = $(el);
				return element.text().trim();
			});
		const content = detailsBlock
			.find("div.detailsStatRight")
			.toArray()
			.map((el) => {
				const element = $(el);
				return element.text().trim();
			});
		const detailsMap = new Map(header.map((h, i) => [h, content[i]]));
		const posted = detailsMap.get("Posted");
		const updated = detailsMap.get("Updated");
		const descriptionHTML = $("div#highlightContent").html();
		const data = toWorkshopDetailData(
			preview,
			descriptionHTML,
			posted,
			updated,
		);
		return data;
	}
}

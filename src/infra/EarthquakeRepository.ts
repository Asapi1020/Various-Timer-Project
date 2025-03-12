import * as cheerio from "cheerio";
import type { Earthquake } from "../domain";
import { toEarthquake } from "../interface-adapters/earthquake";

export class EarthquakeRepository {
	typhoonHost = "https://typhoon.yahoo.co.jp";
	earthquakeUrl = `${this.typhoonHost}/weather/jp/earthquake/list/`;

	async getEarthquakeData(): Promise<Earthquake.Data[]> {
		const response = await fetch(this.earthquakeUrl);
		const html = await response.text();
		const $ = cheerio.load(html);

		const eqhist = $("#eqhist");
		const rows = eqhist.find('tr[bgcolor="#ffffff"]');
		const tableData = rows.map((_, row) => {
			const cells = $(row)
				.find("td")
				.map((_, cell) => $(cell).text().trim())
				.get();
			const link = $(row).find("td a").attr("href");
			return toEarthquake(
				cells[0],
				cells[1],
				cells[2],
				cells[3],
				`${this.typhoonHost}${link}`,
			);
		});

		return tableData.get();
	}
}

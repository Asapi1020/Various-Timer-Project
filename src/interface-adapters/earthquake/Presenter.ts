import { DateTime } from "luxon";
import type { Earthquake } from "../../domain";

export const toEarthquake = (
	time: string,
	epicenter: string,
	magnitude: string,
	seismicIntensity: string,
	link: string,
): Earthquake.Data => {
	return {
		time: convertTime(time),
		epicenter,
		magnitude: Number.parseFloat(magnitude),
		seismicIntensity,
		link,
	};
};

const convertTime = (time: string): Date | null => {
	const date = DateTime.fromFormat(time.replace("ごろ", ""), "yyyy年M月d日 H時m分", { zone: "Asia/Tokyo" });
	return date.isValid ? date.toJSDate() : null;
};

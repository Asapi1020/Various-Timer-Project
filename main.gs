function checkYouTube() {
	const properties = PropertiesService.getScriptProperties();
	const baseUrl = properties.getProperty("YOUTUBE_ANNOUNCER_API");
	const url = `${baseUrl}/api/channels/videos`;

	const response = UrlFetchApp.fetch(url);
	Logger.log(response);
}

function checkEarthquake() {
	const properties = PropertiesService.getScriptProperties();
	const baseUrl = properties.getProperty("TIMER_PROJECT_API");
	const lastAlerted = properties.getProperty("EARTHQUAKE_LAST_ALERTED");
	const url = `${baseUrl}/api/earthquake/alert`;
	const query = lastAlerted ? `?lastAlerted=${lastAlerted}` : "";

	const token = properties.getProperty("TIMER_PROJECT_TOKEN");
	const options = {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		muteHttpExceptions: true,
	};

	const response = UrlFetchApp.fetch(url + query, options);
	Logger.log(response);

	const { data } = getJSON(response);
	if (typeof data !== "string") {
		throw new Error("data is invalid");
	}

	properties.setProperty("EARTHQUAKE_LAST_ALERTED", data);
}

function checkKF2Workshop() {
	const properties = PropertiesService.getScriptProperties();
	const baseUrl = properties.getProperty("TIMER_PROJECT_API");
	const lastAlerted = properties.getProperty("KF2_WORKSHOP_LAST_ALERTED");
	const webhookUrl = properties.getProperty("KF2_WORKSHOP_WEBHOOK_URL");
	const lastUploadedThreadID = properties.getProperty(
		"KF2_WORKSHOP_LAST_UPLOADED_THREAD_ID",
	);
	const lastUpdatedThreadID = properties.getProperty(
		"KF2_WORKSHOP_LAST_UPDATED_THREAD_ID",
	);
	const url = `${baseUrl}/api/workshop/alert`;
	const query = `?lastAlerted=${lastAlerted}&lastUploadedThreadID=${lastUploadedThreadID}&lastUpdatedThreadID=${lastUpdatedThreadID}&webhookUrl=${encodeURI(webhookUrl)}`;

	const options = {
		method: "GET",
		muteHttpExceptions: true,
	};

	const response = UrlFetchApp.fetch(url + query, options);
	Logger.log(response);

	const { data } = getJSON(response);
	if (typeof data !== "string") {
		throw new Error("data is invalid");
	}

	properties.setProperty("KF2_WORKSHOP_LAST_ALERTED", data);
}

/**
 * @param {UrlFetchApp.HTTPResponse} response
 * @returns {object} The parsed JSON object.
 */
const getJSON = (response) => {
	const body = response.getContentText();
	const jsonData = JSON.parse(body);
	return jsonData;
};

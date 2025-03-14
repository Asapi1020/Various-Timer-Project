function checkEarthquake(){
  const properties = PropertiesService.getScriptProperties();
  const baseUrl = properties.getProperty("TIMER_PROJECT_API");
  const lastAlerted = properties.getProperty("EARTHQUAKE_LAST_ALERTED");
  const url = `${baseUrl}/api/earthquake/alert`;
  const query = lastAlerted ? `?lastAlerted=${lastAlerted}` : "";

  const token = properties.getProperty("TIMER_PROJECT_TOKEN");
  const options = {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    muteHttpExceptions: true
  }

  const response = UrlFetchApp.fetch(url + query, options);
  Logger.log(response);

  const { data } = getJSON(response);
  if(typeof data !== "string"){
    throw new Error("data is invalid");
  }

  properties.setProperty("EARTHQUAKE_LAST_ALERTED", data);
}
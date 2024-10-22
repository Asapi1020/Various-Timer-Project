function checkYouTube(){
  const properties = PropertiesService.getScriptProperties();
  const baseUrl = properties.getProperty("YOUTUBE_ANNOUNCER_API");
  const url = baseUrl + "/api/channels/videos";

  const response = UrlFetchApp.fetch(url);
  Logger.log(response);
}
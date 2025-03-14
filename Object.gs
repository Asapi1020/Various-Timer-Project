/**
 * @param {UrlFetchApp.HTTPResponse} response
 * @returns {object} The parsed JSON object.
 */
const getJSON = (response) => {
  const body = response.getContentText();
  const jsonData = JSON.parse(body);
  return jsonData;
}

function getTextContent(res, elem, bIgnore)
{
  return getTextContents(res, elem, bIgnore)[0];
}

function getTextContents(res, elem, bIgnore)
{
  if(bIgnore)
  {
    var temps = Parser.data(res).from('<' + elem).to('/' + elem + '>').iterate();
    for(var i=0; i<temps.length; i++)
    {
      temps[i] = Parser.data(temps[i]).from('>').to('<').build();
    }
    return temps;
  }
  else
  {
    return Parser.data(res).from('<' + elem + '>').to('</' + elem + '>').iterate();
  }
}

function getChildText(elem, name, text)
{
  if(elem.getName() == name) return elem.getText();
  return text;
}

function compileIntList(root)
{
  let result = [];
  
  for(var i=0; i<root.length; i++)
  {
    if(root[i][0] != "")
    {
      result.push(String(Math.floor(root[i][0])));
    }
  }
  return result;
}

function removeTags(str)
{
  let splitbuf = str.split('>');
  for(var i=splitbuf.length-1;i>=0;i--)
  {
    splitbuf[i] = splitbuf[i].split('<')[0];
    if(splitbuf[i].replace(/[\n\s]/g, '') == "")
      splitbuf.splice(i,1);
  }
  return splitbuf;
}

function postWebhook(payload, property, suffix="")
{
  let url = PropertiesService.getScriptProperties().getProperty(property) + suffix;
  let options = {"method": "post", "headers": { 'Content-type': "application/json" }, "payload": JSON.stringify(payload)};
  UrlFetchApp.fetch(url, options);
}

function getUnixTime(time)
{
  formatGMT = Utilities.formatDate(time, 'GMT', 'dd MMM yyyy HH:mm:ss z');
  unixDate = Date.parse(formatGMT) / (10**3);
  return unixDate;
}

function setupRSS(url)
{
  let xml = UrlFetchApp.fetch(url).getContentText();
  let root = XmlService.parse(xml).getRootElement();
  return root.getChildren();
}

function dynamicFetchApp(url){
  let options = {
    url: url,
    renderType: "HTML",
    outputAsJson: true
  };
  let payload = encodeURIComponent(JSON.stringify(options));
  const apiKey = PropertiesService.getScriptProperties().getProperty("API_KEY");
  let apiUrl = "https://phantomjscloud.com/api/browser/v2/"+ apiKey +"/?request=" + payload;
  let res = UrlFetchApp.fetch(apiUrl).getContentText();
  return res;
}

function dynamicFetch(url)
{
  let res = dynamicFetchApp(url);
  return JSON.parse(res)["content"]["data"];
}

function getNumProperty(name, defaultValue=0)
{
  let num = Number(PropertiesService.getScriptProperties().getProperty(name));
  if(!num) return defaultValue;
  return num;
}
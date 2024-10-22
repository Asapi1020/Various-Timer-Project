const url_typhoon = "https://typhoon.yahoo.co.jp";
const url_earthquake = url_typhoon + "/weather/jp/earthquake/list/";

function checkEarthquake()
{
  let res = UrlFetchApp.fetch(url_earthquake).getContentText("utf-8");
  res = Parser.data(res).from('<div id="eqhist"').to('</div>').build();
  let rows = Parser.data(res).from('<tr bgcolor="#ffffff"').to('</tr>').iterate();
  let lastAlert = PropertiesService.getScriptProperties().getProperty('lastAlert');
  let thisAlert;

  for(var i=0; i<rows.length; i++)
  {
    var cells = getTextContents(rows[i], 'td', true);
    var data = cells[0].split(">");
    data[0] = url_typhoon + Parser.data(data[0]).from('href="').to('"').build();

    if(i===0)
      thisAlert = data[1];

    if(lastAlert == data[1])
    {
      Logger.log("End Update");
      break;
    }
    else
    {
      Logger.log(data);

      if(Number(cells[3][0]) >= 4 && !tryNotifyEarthquake(data[0], 'Webhook_EarthquakeNotice'))
      {
        Logger.log("Failed to notify");
        return;
      }
    }
  }
  PropertiesService.getScriptProperties().setProperty('lastAlert', thisAlert);
}

function tryNotifyEarthquake(data, webhookName)
{
  try
  {
    return notifyEarthquake(data, webhookName);
  }
  catch(Error)
  {    
    return false;
  }
}

function notifyEarthquake(url, alertWebhook)
{
  let res = UrlFetchApp.fetch(url).getContentText("utf-8");

  let url_img = Parser.data(res).from('id="earthquake-01"').to('</div>').build();
  url_img = Parser.data(url_img).from('<img src="').to('"').build();
  if(!url_img.substring(url_img.lastIndexOf('.')).includes('.png'))
  {
    Logger.log("[ERROR] No image is found");
    return false;
  }

  res = Parser.data(res).from('<div id="eqinfdtl"').to('</div>').build();
  res = Parser.data(res).from('<table').to('</table>').build();
  let rows = Parser.data(res).from('<tr').to('</tr>').iterate();
  let contents = [];
  for(var row of rows)
  {
    var cells = getTextContents(row, 'small');
    switch(cells[0])
    {
      case '震源地':
        contents.push("震源地：" + decompileEpicenter(cells[1]));
        break;
      case '最大震度':
        contents.push("最大震度：" + cells[1]);
        break;
      case 'マグニチュード':
        contents.push("マグニチュード：" + cells[1]);
        break;
    }
  }
  
  let embeds = [
    {
      "author": {"name": "Yahoo!天気・災害"},
      "title": "地震情報",
      "url": url,
      "description": contents.join('\n'),
      "color": parseInt("F8E71C",16),
      "image": {"url": url_img}
    }
  ]
  let payload = {"embeds": embeds};
  let options = {"method": "post", "headers": { 'Content-type': "application/json" }, "payload": JSON.stringify(payload)};
  UrlFetchApp.fetch(PropertiesService.getScriptProperties().getProperty(alertWebhook), options);
  return true;
}

function decompileEpicenter(res)
{
  let splitbuf = res.split("</a>");
  return splitbuf[0].split(">")[1] + splitbuf[1].split("\n")[0];
}
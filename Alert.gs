const url_typhoon = "https://typhoon.yahoo.co.jp";
const url_earthquake = url_typhoon + "/weather/jp/earthquake/list/";

function checkEarthquake()
{
  let res = UrlFetchApp.fetch(url_earthquake).getContentText("utf-8");
  res = Parser.data(res).from('<div id="eqhist"').to('</div>').build();
  let rows = Parser.data(res).from('<tr bgcolor="#ffffff"').to('</tr>').iterate();
  let lastAlert = PropertiesService.getScriptProperties().getProperty('lastAlert');

  for(var i=0; i<rows.length; i++)
  {
    var cells = getTextContents(rows[i], 'td', true);
    var data = cells[0].split(">");
    data[0] = url_typhoon + Parser.data(data[0]).from('href="').to('"').build();

    if(i===0)
      PropertiesService.getScriptProperties().setProperty('lastAlert', data[1]);

    if(lastAlert == data[1])
    {
      Logger.log("No update");
      return;
    }
    else if(Number(cells[3][0]) >= 4)
    {
      notifyEarthquake(data[0], data[1]);
    }
  }
}

function notifyEarthquake(url, date)
{
  let res = UrlFetchApp.fetch(url).getContentText("utf-8");

  let url_img = Parser.data(res).from('id="earthquake-01"').to('</div>').build();
  url_img = Parser.data(url_img).from('<img src="').to('"').build();
  let img = UrlFetchApp.fetch(url_img).getBlob();

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
  contents.push("[詳細はリンク先からご確認ください](" + url + ")");
  let payload = {file: img, "content": contents.join('\n')};
  let options = {"method": "post", "payload": payload};
  UrlFetchApp.fetch(PropertiesService.getScriptProperties().getProperty('Webhook_EarthquakeNotice'), options);
}

function decompileEpicenter(res)
{
  let splitbuf = res.split("</a>");
  return splitbuf[0].split(">")[1] + splitbuf[1].split("\n")[0];
}
function scanRSS()
{
  const date = getUnixTime(new Date());
  scanKF2JP(date);
}

function scanKF2JP(date)
{
  const rss_kf2jp = setupRSS("https://w.atwiki.jp/killingfloor2a/rss10.xml");
  let lastUpdate = getNumProperty('KF2JP_UPDATE');
  let results = [];
  
  for(var i=0; i<rss_kf2jp.length; i++)
  {
    if(rss_kf2jp[i].getName() == "item")
    {
      var itemChildren = rss_kf2jp[i].getChildren();
      var title, link, utime;
      for(var j=0; j<itemChildren.length; j++)
      {
        title = getChildText(itemChildren[j], "title", title);
        link = getChildText(itemChildren[j], "link", link);
        utime = getChildText(itemChildren[j], "utime", utime);
      }
      
      if(Number(utime) > lastUpdate)
      {
        results.push("[" + title + "](" + link + ")");
      }
      else
      {
        break;
      }
    }
  }
  if(results.length > 0)
  {
    postWebhook("KF2日本Wikiに更新がありました！\n" + results.join("\n"), 'Webhook_WikiUpdateTracker');
    PropertiesService.getScriptProperties().setProperty('KF2JP_UPDATE', date);
  }
  else
  {
    Logger.log("No update is found.");
  }
}

function postWebhook(text, property)
{
  let url = PropertiesService.getScriptProperties().getProperty(property);
  let payload = {"content": text};
  let options = {"method": "post", "payload": payload};
  UrlFetchApp.fetch(url, options);
}

function getChildText(elem, name, text)
{
  if(elem.getName() == name) return elem.getText();
  return text;
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

function getNumProperty(name)
{
  let num = Number(PropertiesService.getScriptProperties().getProperty(name));
  if(!num) return 0;
  return num;
}
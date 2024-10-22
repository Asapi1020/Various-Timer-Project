function scanRSS()
{
//scanKF2JP();
  scanKF2Workshop();
}

function scanKF2JP()
{
  const date = getUnixTime(new Date());
  const rss_kf2jp = setupRSS("https://w.atwiki.jp/killingfloor2a/rss10.xml");
  let lastUpdate = getNumProperty('KF2JP_UPDATE');
  
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
        notifyKF2JP(title, link);
      }
      else
      {
        break;
      }
    }
  }
  PropertiesService.getScriptProperties().setProperty('KF2JP_UPDATE', date);
}

function notifyKF2JP(title, link)
{
  let res = dynamicFetch(link.replace("pages", "diffx"));
  res = res.split('<div id="prettydiff"')[1];
  let diff = res.split('<div class="diff-right">');
  diff[1] = diff[1].split('<footer')[0];
  let fields = [];
  
  for(var i=0; i<2; i++)
  {
    diff[i] = diff[i].split('<div class="data-wrap">')[1];
    var lines = Parser.data(diff[i]).from('<li').to('</li>').iterate();
    var newLines = [];
    Logger.log(lines);
    for(var line of lines)
    {
      if(newLines.length >= 10)
      {
        newLines.push("...");
        break;
      }
      
      if(line.includes('class="skip"') || line.includes('class="equal"') || line.includes('class="empty"'))
        continue;

      line = line.replace('class="delete">',"⊖ ").replace('class="insert">',"⊕ ");
      line = line.replace('class="replace">',(i==0) ? "⊖ " : "⊕ ");
      line = line.replaceAll('<em>', '').replaceAll('</em>', '').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
      newLines.push(line);
    }

    var field = {};
    field.name = (i==0) ? "変更前" : "変更後";
    field.value = newLines.join('');
    field.inline = true;
    Logger.log(field);
    fields.push(field);
  }
  
  let payload = {
    "embeds": [
      {
        "author": {"name": "Killing Floor 2 - 日本 Wiki"},
        "title": "KF2日本Wikiに更新がありました！",
        "description": "[" + title + "](" + link + ")",
        "thumbnail": {"url": "https://wiki.killingfloor2.com/images/7/7a/KF2_Icon.png"},
        "color": parseInt("D0021B", 16),
        "fields": fields
      }
    ]
  }
  Logger.log("Notified update");
  const webhookName = 'Webhook_WikiUpdateTracker'
  postWebhook(payload, webhookName);
}

function scanKF2Workshop()
{
  const date = getUnixTime(new Date());
  let lastUpdate = getNumProperty('WORKSHOP_UPDATE');
  scanKF2WorkshopCore("&browsesort=lastupdated&actualsort=lastupdated&p=1", false, lastUpdate);
  scanKF2WorkshopCore("&browsesort=mostrecent&section=readytouseitems&p=1", true, lastUpdate);
  PropertiesService.getScriptProperties().setProperty('WORKSHOP_UPDATE', date);
}

function scanKF2WorkshopCore(suffix, bFirstUpload, lastUpdate)
{
  const workshopURL = "https://steamcommunity.com/workshop/browse/?appid=232090";
  // Logger.log(lastUpdate);
  // Logger.log(getUnixTime(new Date()));
  let res = UrlFetchApp.fetch(workshopURL + suffix).getContentText('utf-8');
  res = res.split('<div class="workshopBrowseItems">')[1];
  let pannels = res.split('<div data-panel=');
  let pendingNotifications = [];

  for(var pannel of pannels)
  {
    if(!pannel.includes('https://steamcommunity.com/sharedfiles/filedetails/?id='))
      continue;
    
    var link = Parser.data(pannel).from('<a href="').to('"').build();
    link = link.split('&searchtext=')[0];
    
    res = UrlFetchApp.fetch(link).getContentText('utf-8');
    var splitbuf = res.split('<div class="rightDetailsBlock">');

    for(var elem of splitbuf)
    {
      if(elem.includes('<div class="detailsStatsContainerLeft">'))
        break;
    }
    
    var statsContainerL = elem.split('<div class="detailsStatsContainerLeft">')[1];
    var statsL = Parser.data(statsContainerL).from('<div class="detailsStatLeft">').to('</div>').iterate();
    
    var statsContainerR = elem.split('<div class="detailsStatsContainerRight">')[1];
    var statsR = Parser.data(statsContainerR).from('<div class="detailsStatRight">').to('</div>').iterate();

    var updateTime;
    updateTime = statsR[statsL.indexOf(bFirstUpload ? "Posted " : "Updated ")];    
    Logger.log(updateTime);
    if(decompileWorkshopTime(updateTime) > lastUpdate)
    {
      pendingNotifications.unshift({"res": res, "time": updateTime.replace(' @', ','), "link": link});
    }
    else
    {
      break;
    }
  }

  for(var notification of pendingNotifications)
    notifyWorkshopUpdate(notification.res, notification.time, notification.link, bFirstUpload);

  Logger.log("Posted " + pendingNotifications.length + (bFirstUpload ? " uploads" : " updates"));
}

function notifyWorkshopUpdate(res, time, link, bFirstUpload)
{
  let title = Parser.data(res).from('<div class="workshopItemTitle">').to('</div>').build();

  let header = res.split('<div class="workshop_item_header">')[1];
  let screenshots = header.split('<div class="screenshot_holder">');
  for(var shot of screenshots)
  {
    if(shot.includes('<img'))
    {
      shot = Parser.data(shot).from('src="').to('"').build();
      break;
    }
  }

  let splitbuf = header.split('<div class="workshopItemPreviewImageMain">');
  let logo = "";
  if(splitbuf.length >= 2)
  {
    logo = Parser.data(splitbuf[1]).from('<img').to('>').build();
    logo = Parser.data(logo).from('src="').to('"').build();
  }

  let sidebar = res.split('<div id="rightContents"')[1];
  sidebar = sidebar.split('<div class="creatorsBlock"')[1];
  let authors = sidebar.split('<div data-panel');
  for(var i=authors.length-1; i>=0; i--)
  {
    if(!authors[i].includes('<div class="friendBlockContent">'))
      authors.splice(i,1);
  }
  let author = {};
  for(var i=0; i<authors.length; i++)
  {
    if(i==0)
    {
      author.url = Parser.data(authors[i]).from('href="').to('"></a>').build();
      author.icon_url = Parser.data(authors[i]).from('<img src="').to('"').build();
    }
    authors[i] = Parser.data(authors[i]).from('<div class="friendBlockContent">').to('<br>').build().replace(/^\s+/, '');
  }
  author.name = authors.join(', ');

  let description = res.split('<div id="profileBlock"')[1];
  description = Parser.data(description).from('id="highlightContent">').to('<script>').build();
  let fields = [];
  if(description.includes('<div class="bb_h1">'))
  {
    fields = description.split('<div class="bb_h1">');
    description = fields[0];
    fields.splice(0,1);
  }

  splitbuf = removeTags(description);
  splitbuf = splitbuf.join('\n').split('\n');
  splitbuf.length = Math.min(splitbuf.length, 5);
  description = splitbuf.join('\n');

  for(i=0; i<fields.length; i++)
  {
    var field = {};
    splitbuf = fields[i].split('</div>');
    field.name = splitbuf[0];
    splitbuf = removeTags(fields[i].split(field.name + '</div>')[1]);
    splitbuf = splitbuf.join('\n').split('\n');
    splitbuf.length = Math.min(splitbuf.length, 3);
    field.value = splitbuf.join('\n');
    fields[i] = field;
  }

  let payload = {
    "embeds": [
      {
        "author": author,
        "title": title,
        "url": link,
        "description": description,
        "color": parseInt("0024C4",16),
        "fields": fields,
        "thumbnail": (logo != "") ? {"url": logo} : {},
        "image": {"url": shot},
        "footer": {"text": time}
      }
    ]
  }

  const uploadThread = "1203234733153062932";
  const updateThread = "1203234856818188348";
  postWebhook(payload,'Webhook_Workshop', '?thread_id=' + (bFirstUpload ? uploadThread : updateThread));
}

function decompileWorkshopTime(time)
{
  const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Des"];
  let splitTime = time.split(" @ ");
  let splitDate = splitTime[0].split(", ");
  let year = (splitDate.length < 2) ? (new Date()).getFullYear() : splitDate[1];

  splitDate = splitDate[0].split(" ");
  let monthIndex = month.indexOf(splitDate[0]);
  let date = splitDate[1];

  splitTime = splitTime[1].split(":");
  let hours, minutes;
  if(splitTime[1].includes("am"))
  {
    hours = splitTime[0];
    minutes = splitTime[1].split("am")[0];
  }
  else
  {
    hours = Number(splitTime[0]) + 12;
    minutes = splitTime[1].split("pm")[0];
  }

  return getUnixTime(new Date(year,monthIndex,date,hours,minutes));
}
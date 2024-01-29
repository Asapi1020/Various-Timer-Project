function getID()
{
  return "1Mtszd3SUOAmJ7vuO8WSNIlKRuKrrjGN6zfKt-ux1aJs";
}

function initialAnalyze()
{
  registerProperties(1,0,0,0);
  analyzeRank();
  let url_webhook = PropertiesService.getScriptProperties().getProperty('webhook');
  let payload = {"content": '国内株式の配当利回りランキングが更新されました\nhttps://docs.google.com/spreadsheets/d/' + getID()};
  let options = {"method": "post", "payload": payload};
  UrlFetchApp.fetch(url_webhook, options);
}

function analyzeRank()
{  
  const url_Rank = "https://finance.yahoo.co.jp/stocks/ranking/dividendYield?market=all&term=daily&page=";
  const url_IRBank = "https://irbank.net";
  const idSheet = getID();
  const spreadSheet = SpreadsheetApp.openById(idSheet);
  const blackListSheet = spreadSheet.getSheetByName("Black List");
  const rankSheet = spreadSheet.getSheetByName("Rank");
  const analysisNum = 100;

  let blackListRoot = blackListSheet.getRange("A:A").getValues();
  let annualBlackListRoot = blackListSheet.getRange("B:B").getValues();
  let blackList = compileIntList(blackListRoot);
  let annualBlackList = compileIntList(annualBlackListRoot);
  let savedYear = blackListSheet.getRange("C1").getValue();
  let newBlackCount = 0;
  let newAnnualCount = 0;
  
  let count = Number(PropertiesService.getScriptProperties().getProperty('count'));
  if(!count) count = 0;
  //let count = 0;
  let checkCount = Number(PropertiesService.getScriptProperties().getProperty('checkCount'));
  if(!checkCount) checkCount = 0;
  //let checkCount = 0;
  let startTime = new Date();
  let year = startTime.getFullYear();

  if(year != savedYear)
  {
    blackListSheet.getRange("C1").setValue(year);
    for(var i=0; i<annualBlackList.length; i++)
    {
      blackListSheet.getRange(i+1,2).setValue("");
    }
    annualBlackList.length = 0;
    Logger.log("Update annual black list");
  }

  // Scrape Yahoo Finance
  let startPage = Number(PropertiesService.getScriptProperties().getProperty('page'));
  if(!startPage) startPage = 1;
  //startPage = 1;
  let startIndex = Number(PropertiesService.getScriptProperties().getProperty('index'));
  if(!startIndex) startIndex = 0;
  //startIndex = 0;

  for(var page=startPage; true; page++)
  {
    var res_Rank = UrlFetchApp.fetch(url_Rank + page).getContentText("utf-8");
    var table_Rank = Parser.data(res_Rank).from('<table class="zvh5L2Gz">').to('</table>').build();
    var corpList = Parser.data(table_Rank).from('<tr class="_1GwpkGwB">').to('</tr>').iterate();

    for(var i=startIndex; i<corpList.length; i++)
    {
      // Escape Timeout
      if((new Date() - startTime)/1000 > 300)
      {
        registerProperties(page, i, count, checkCount);
        Logger.log("Escape timeout. Reboot 10 seconds later...");
        ScriptApp.newTrigger('analyzeRank').timeBased().after(10 * 1000).create();
        return;
      }
      
      ++checkCount;
      var cells = Parser.data(corpList[i]).from('<td').to('/td>').iterate();
      var corp = {};
      var bSkip = false;
      
      corp.code = Parser.data(cells[0]).from('<li class="vv_mrYM6">').to('</li>').build();
      if(blackList.includes(corp.code) || annualBlackList.includes(corp.code))
      {
        //Logger.log("%s : Skip black list", corp.code);
        continue;
      }

      corp.name = getTextContent(cells[0], "a", true);
      corp.dps =  Parser.data(cells[3]).from('<span class="_3rXWJKZF">').to('</span>').build();
      corp.dy =   Parser.data(cells[4]).from('<span class="_3rXWJKZF">').to('</span>').build();

      // IR Bank
      var res_IRBank = UrlFetchApp.fetch(url_IRBank + "/" + corp.code).getContentText("utf-8");
      var url_Suffix = Parser.data(res_IRBank).from('<a title="決算まとめ" href="').to('">決算</a>').build();
      corp.url = url_IRBank + url_Suffix;
      var res_summary = UrlFetchApp.fetch(corp.url).getContentText("utf-8");
      var sections = getTextContents(res_summary, "section");
      
      // キャッシュ・フローの推移
      corp.cf = extractData(sections[2], ["営業CF","現金等"]);
      for(var j=0; j<corp.cf[0].length; j++)
      {
        if(corp.cf[0][j][0] == "-")
        {
          bSkip = true;
          ++newBlackCount;
          blackListSheet.getRange(newBlackCount+blackList.length,1).setValue(String(corp.code));
          break;
        }
      }
      if(bSkip)
      {
        //Logger.log("%s: Skip because of cash flow", corp.code);
        continue;
      }

      // 配当推移
      corp.share = extractData(sections[3], ["一株配当","配当性向"]);
      if(corp.share[1].length > 0)
      {
        var lastPayRat = corp.share[1][corp.share[1].length-1];
        if(lastPayRat == "赤字" || Number(lastPayRat) < 30 || 60 < Number(lastPayRat))
        {
          //Logger.log("%s: Skip because of share", corp.code);
          ++newAnnualCount;
          blackListSheet.getRange(newAnnualCount+annualBlackList.length,2).setValue(String(corp.code));
          continue;
        }
      }

      // 財務状況
      corp.finance = extractData(sections[1], ["自己資本比率"]);
      if(corp.finance[0].length > 0)
      {
        if(Number(corp.finance[0][corp.finance[0].length-1]) < 30)
        {
          ++newAnnualCount;
          blackListSheet.getRange(newAnnualCount+annualBlackList.length,2).setValue(String(corp.code));
          continue;
        }
      }

      // 会社業績
      corp.perf = extractData(sections[0], ["売上","EPS","営利率"]);
      var profitRatLen = corp.perf[2].length;
      if(profitRatLen > 0)
      {
        if( Number(corp.perf[2][profitRatLen-1]) < 5 ||
          (profitRatLen > 1 && Number(corp.perf[2][profitRatLen-2]) < 5))
        {
          ++newAnnualCount;
          blackListSheet.getRange(newAnnualCount+annualBlackList.length,2).setValue(String(corp.code));
          continue;
        }
      }
      
      var res_genre = UrlFetchApp.fetch((corp.url).split("/result")[0]).getContentText("utf-8");
      corp.genre = Parser.data(res_genre).from('<a title="業種').to('</a>').build();
      corp.genre = corp.genre.split(">")[1];

      ++count;

      registerCorp(rankSheet, corp, count);

      if(count >= analysisNum)
      {
        Logger.log("Skip %s", String(Math.floor(checkCount)));
        return;
      }
    }
  }
}

function registerProperties(page, i, count, checkCount)
{
  PropertiesService.getScriptProperties().setProperty('page', page);
  PropertiesService.getScriptProperties().setProperty('index', i);
  PropertiesService.getScriptProperties().setProperty('count', count);
  PropertiesService.getScriptProperties().setProperty('checkCount', checkCount);
}

function registerCorp(rankSheet, corp, count)
{
  rankSheet.getRange(count+1, 1).setValue(corp.code);
  rankSheet.getRange(count+1, 2).setValue(`=HYPERLINK("${corp.url}","${corp.name}")`);
  rankSheet.getRange(count+1, 3).setValue(corp.genre);
  rankSheet.getRange(count+1, 4).setValue(`${corp.dy}%`);
  rankSheet.getRange(count+1, 5).setValue(checkGrowth(corp.perf[0]));
  rankSheet.getRange(count+1, 6).setValue(checkGrowth(corp.perf[1]));
  rankSheet.getRange(count+1, 7).setValue(corp.perf[2][corp.perf[2].length-1]);
  rankSheet.getRange(count+1, 8).setValue(corp.finance[0][corp.finance[0].length-1]);
  rankSheet.getRange(count+1, 9).setValue(checkGrowth(corp.cf[0]));
  rankSheet.getRange(count+1,10).setValue(checkGrowth(corp.cf[1]));
  rankSheet.getRange(count+1,11).setValue(checkGrowth(corp.share[0]));
  rankSheet.getRange(count+1,12).setValue(corp.share[1][corp.share[1].length-1]);
  Logger.log(`Registered: ${corp.code} (${corp.name})`);
}

function checkGrowth(list)
{
  let records = [];
  records.length = 3;
  
  if(list.length > 0)
  {
    records[0] = list[0];
    if(list.length >= 5)
      records[1] = list[list.length-5];
    else
      records[1] = records[0];

    records[2] = list[list.length-1];

    if(!matchUnit(records))
      Logger.log(`Unmatch Unit Error`);

    if(extractNum(records[2]) - extractNum(records[1]) < 0)
    {
      if(extractNum(records[2]) - extractNum(records[0]) < 0)
        return "×";
      else
        return "△";
    }
    else if(extractNum(records[2]) - extractNum(records[0]) < 0)
    {
      return "〇";
    }
    else
    {
      return "◎";
    }
  }
  return "";
}

function extractNum(s)
{
  return Number(s.replace(/[^0-9.-]/g, ''));
}

function matchUnit(list)
{
  const unit = list[0].replace(/[0-9.-]/g, '');
  
  for(var i=1; i<list.length; i++)
  {
    if(unit != list[i].replace(/[0-9.-]/g, ''))
      return false;
  }
  return true;
}

function extractData(section, indicators)
{
  let table = Parser.data(section).from('<table class="bar bs"').to('</table>').build();

  // Header
  let header = getTextContent(table, "thead");
  let cells = getTextContents(header, "th");

  let indexes = [];
  indexes.length = indicators.length;

  // Find Col
  for(var i=0; i<cells.length; i++)
  {
    for(var j=0; j<indicators.length; j++)
    {
      if(getTextContent(cells[i],"a",true) == indicators[j])
      {
        indexes[j] = i;
      }
    }
  }

  // Body
  let body = Parser.data(table).from('<tbody').to('</tbody>').build();
  let rows = Parser.data(body).from('<tr').to('</tr>').iterate();

  let result = [];
  result.length = indexes.length;
  for(i=0; i<result.length; i++)
  {
    result[i] = [];
  }

  for(i=0; i<rows.length; i++)
  {
    cells = Parser.data(rows[i]).from('<td').to('/td>').iterate();
    for(j=0; j<indexes.length; j++)
    {
      if(indexes[j] > 0)
      {
        var content = Parser.data(cells[indexes[j]]).from('<span class="text">').to('</span>').build();
        if(content.substr(0,5) == "<span")
        {
          content = cells[indexes[j]].split('<span class="co_red">')[1];
          var splitbuf = content.split("</span>");
          if(splitbuf[0] == "*")
          {
            content = splitbuf[1];
          }
          else
          {
            content = splitbuf[0];
          }
        }
        if(content == ">-<" || content == "")
        {
          continue;
        }
        result[j].push(content);
      }
    }
  }

  return result;
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
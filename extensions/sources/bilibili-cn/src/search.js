load('config.js');
load('cryptojs.js');
load('wbi.js');

function cleanText(s) {
    return ((s || "") + "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function execute(key, page) {
    if (!page) page = "1";

    // Signed search endpoint (plain /x/web-interface/search/type is risk-controlled)
    var res = biliFetchWbi("/x/web-interface/wbi/search/type", {
        search_type: "video",
        keyword: key,
        page: page
    });

    if (!res || !res.ok) return Response.error("Search failed");

    var json = res.json();
    if (!json || json.code !== 0 || !json.data) return Response.success([]);

    var list = json.data.result || [];
    var data = [];

    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if ((item.type || "") !== "video") continue;

        var bvid = (item.bvid || "") + "";
        var title = cleanText(item.title);
        var link = "";
        if (bvid) link = "https://www.bilibili.com/video/" + bvid;
        else if (item.aid) link = "https://www.bilibili.com/video/av" + item.aid;
        if (!link || !title) continue;

        var pic = (item.pic || "") + "";
        if (pic.indexOf("//") === 0) pic = "https:" + pic;

        var author = cleanText(item.author);
        var play = item.play || 0;
        var descParts = [];
        if (author) descParts.push("UP: " + author);
        if (play) descParts.push("Lượt xem: " + play);

        data.push({
            name: title,
            link: link,
            cover: pic,
            description: descParts.join(" | "),
            host: BASE_URL,
            tag: (item.typename || "") + ""
        });
    }

    var numPages = json.data.numPages || 0;
    var numResults = json.data.numResults || 0;
    var nextPage = null;
    if (numResults > 0 && parseInt(page) < numPages) {
        nextPage = String(parseInt(page) + 1);
    }

    return Response.success(data, nextPage);
}

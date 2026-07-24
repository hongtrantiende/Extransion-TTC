load('config.js');

function execute(url) {
    var bvidMatch = url.match(/video\/(BV[a-zA-Z0-9]+)/i);
    var aidMatch = url.match(/video\/av(\d+)/i);

    var apiUrl = "";
    if (bvidMatch && bvidMatch[1]) {
        apiUrl = "https://api.bilibili.com/x/web-interface/view?bvid=" + bvidMatch[1];
    } else if (aidMatch && aidMatch[1]) {
        apiUrl = "https://api.bilibili.com/x/web-interface/view?aid=" + aidMatch[1];
    } else {
        return Response.error("Invalid Bilibili video URL format");
    }

    var res = fetch(apiUrl, {
        headers: HEADERS
    });

    if (!res.ok) return Response.error("Cannot load TOC: " + res.status);

    var json = res.json();
    if (!json || json.code !== 0 || !json.data) {
        return Response.error("Invalid response for TOC");
    }

    var data = json.data;
    var bvid = data.bvid || "";
    var pages = data.pages || [];
    var chapters = [];

    if (pages && pages.length > 0) {
        for (var i = 0; i < pages.length; i++) {
            var p = pages[i];
            var pNum = p.page || (i + 1);
            var pTitle = p.part || ("Phần " + pNum);
            var cid = p.cid || "";
            var pageUrl = "https://www.bilibili.com/video/" + bvid + "?cid=" + cid + "&p=" + pNum;

            chapters.push({
                name: "P" + pNum + ": " + pTitle,
                url: pageUrl,
                host: BASE_URL
            });
        }
    } else {
        var defaultCid = data.cid || "";
        chapters.push({
            name: "Xem Video",
            url: "https://www.bilibili.com/video/" + bvid + "?cid=" + defaultCid,
            host: BASE_URL
        });
    }

    return Response.success(chapters);
}

load('config.js');
load('cryptojs.js');
load('wbi.js');

function buildChapters(bvid, pages) {
    var chapters = [];
    for (var i = 0; i < pages.length; i++) {
        var p = pages[i];
        var pNum = p.page || (i + 1);
        var pTitle = (p.part || ("Phần " + pNum)) + "";
        var cid = (p.cid || "") + "";
        chapters.push({
            name: "P" + pNum + ": " + pTitle,
            url: "https://www.bilibili.com/video/" + bvid + "?cid=" + cid + "&p=" + pNum,
            host: BASE_URL
        });
    }
    return chapters;
}

function execute(url) {
    var bvidMatch = url.match(/video\/(BV[a-zA-Z0-9]+)/i);
    var aidMatch = url.match(/video\/av(\d+)/i);

    var bvid = bvidMatch ? bvidMatch[1] : "";
    var aid = aidMatch ? aidMatch[1] : "";

    // Signed view API gives bvid + full pages list
    var params = bvid ? { bvid: bvid } : (aid ? { aid: aid } : null);
    if (params) {
        var res = biliFetchWbi("/x/web-interface/wbi/view", params);
        if (res && res.ok) {
            var json = res.json();
            if (json && json.code === 0 && json.data && json.data.pages && json.data.pages.length) {
                var realBvid = (json.data.bvid || bvid) + "";
                return Response.success(buildChapters(realBvid, json.data.pages));
            }
        }
    }

    // Fallback: pagelist works even where the plain view API is banned (412)
    if (bvid) {
        var pl = fetch("https://api.bilibili.com/x/player/pagelist?bvid=" + bvid, { headers: HEADERS });
        if (pl.ok) {
            var pj = pl.json();
            if (pj && pj.code === 0 && pj.data && pj.data.length) {
                return Response.success(buildChapters(bvid, pj.data));
            }
        }
    }

    return Response.error("Cannot load TOC");
}

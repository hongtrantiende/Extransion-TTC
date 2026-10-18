load('config.js');
load('cryptojs.js');
load('wbi.js');

function execute(url) {
    var bvidMatch = url.match(/video\/(BV[a-zA-Z0-9]+)/i);
    var aidMatch = url.match(/video\/av(\d+)/i);

    var bvid = bvidMatch ? bvidMatch[1] : "";
    var aid = aidMatch ? aidMatch[1] : "";

    var data = null;
    if (bvid || aid) {
        var params = bvid ? { bvid: bvid } : { aid: aid };
        var res = biliFetchWbi("/x/web-interface/wbi/view", params);
        if (res && res.ok) {
            var json = res.json();
            if (json && json.code === 0 && json.data) data = json.data;
        }
    }

    if (data) {
        var title = (data.title || "") + "";
        var pic = (data.pic || "") + "";
        if (pic.indexOf("//") === 0) pic = "https:" + pic;
        var author = data.owner ? ((data.owner.name || "") + "") : "";
        var desc = (data.desc || "") + "";
        var stat = data.stat || {};
        var views = stat.view || 0;
        var danmaku = stat.danmaku || 0;

        var info = [];
        if (author) info.push("UP: " + author);
        if (views) info.push("Lượt xem: " + views);
        if (danmaku) info.push("Danmaku: " + danmaku);
        if (desc) info.push("", desc);

        return Response.success({
            name: title,
            cover: pic,
            host: BASE_URL,
            author: author,
            description: info.join("<br>"),
            ongoing: false,
            format: "series",
            genres: [],
            suggests: [],
            comments: []
        });
    }

    // Fallback: the plain view API is banned (412) on flagged IPs; build the
    // minimal detail page from pagelist (needs bvid only).
    if (bvid) {
        var pl = fetch("https://api.bilibili.com/x/player/pagelist?bvid=" + bvid, { headers: HEADERS });
        if (pl.ok) {
            var pj = pl.json();
            if (pj && pj.code === 0 && pj.data && pj.data.length) {
                var name = (pj.data[0].part || bvid) + "";
                return Response.success({
                    name: name,
                    cover: "",
                    host: BASE_URL,
                    author: "",
                    description: "",
                    ongoing: false,
                    format: "series",
                    genres: [],
                    suggests: [],
                    comments: []
                });
            }
        }
    }

    return Response.error("Failed to load video info from Bilibili");
}

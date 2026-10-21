load('config.js');
load('cryptojs.js');
load('wbi.js');

var BILI_QUALITY_LABELS = {
    120: "4K",
    116: "1080P60",
    112: "1080P+",
    80: "1080P",
    74: "720P60",
    64: "720P (HD)",
    32: "480P",
    16: "360P (Tiết kiệm dữ liệu)"
};

function qualityLabel(qn) {
    var label = BILI_QUALITY_LABELS[qn];
    return label ? ("Bilibili " + label) : ("Bilibili Q" + qn);
}

function execute(url) {
    var bvidMatch = url.match(/video\/(BV[a-zA-Z0-9]+)/i);
    var aidMatch = url.match(/video\/av(\d+)/i);
    var cidMatch = url.match(/[?&]cid=(\d+)/i);

    var bvid = bvidMatch ? bvidMatch[1] : "";
    var aid = aidMatch ? aidMatch[1] : "";
    var cid = cidMatch ? cidMatch[1] : "";

    if (!cid || cid === "0" || !bvid) {
        var info = biliResolveVideo(bvid, aid);
        bvid = info.bvid || bvid;
        cid = (cid && cid !== "0") ? cid : info.cid;
    }

    if (!bvid || !cid) {
        return Response.error("Cannot resolve Bilibili video stream identifiers");
    }

    var tracks = [];
    var seenQn = {};

    // Request highest first; the API returns the best quality available to an
    // anonymous session (720P max on most videos). Dedupe by real quality.
    var qnPlan = [64, 32, 16];
    for (var i = 0; i < qnPlan.length; i++) {
        var qn = qnPlan[i];
        var api = "https://api.bilibili.com/x/player/playurl?bvid=" + bvid +
            "&cid=" + cid + "&qn=" + qn + "&platform=html5&high_format=1";
        var res = fetch(api, { headers: HEADERS });
        if (!res.ok) continue;
        var json = res.json();
        if (!json || json.code !== 0 || !json.data || !json.data.durl || !json.data.durl.length) continue;

        var realQn = json.data.quality || qn;
        if (seenQn[realQn]) continue;

        var mp4Url = (json.data.durl[0].url || "") + "";
        if (!mp4Url) continue;

        seenQn[realQn] = true;
        tracks.push({
            title: qualityLabel(realQn),
            data: mp4Url
        });
    }

    // Web player embed as last resort (opens in the in-app WebView)
    tracks.push({
        title: "Bilibili Web Player (Embed)",
        data: "https://player.bilibili.com/player.html?bvid=" + bvid + "&cid=" + cid + "&page=1&high_quality=1&danmaku=0"
    });

    return Response.success(tracks);
}

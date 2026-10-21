load('config.js');

function execute(url) {
    var bvidMatch = url.match(/video\/(BV[a-zA-Z0-9]+)/i);
    var cidMatch = url.match(/[?&]cid=(\d+)/i);

    var bvid = bvidMatch ? bvidMatch[1] : "";
    var cid = cidMatch ? cidMatch[1] : "";

    if (!cid && bvid) {
        var viewRes = fetch("https://api.bilibili.com/x/web-interface/view?bvid=" + bvid, {
            headers: HEADERS
        });
        if (viewRes.ok) {
            var viewJson = viewRes.json();
            if (viewJson && viewJson.code === 0 && viewJson.data) {
                cid = viewJson.data.cid || "";
            }
        }
    }

    if (!bvid || !cid) {
        return Response.error("Cannot resolve Bilibili video stream identifiers");
    }

    var tracks = [];

    // 1. Quality 1: HD (720P / 1080P)
    var playUrlHD = "https://api.bilibili.com/x/player/playurl?bvid=" + bvid + "&cid=" + cid + "&qn=64&platform=html5&high_format=1";
    var resHD = fetch(playUrlHD, { headers: HEADERS });
    if (resHD.ok) {
        var jsonHD = resHD.json();
        if (jsonHD && jsonHD.code === 0 && jsonHD.data && jsonHD.data.durl && jsonHD.data.durl.length) {
            var mp4UrlHD = jsonHD.data.durl[0].url || "";
            if (mp4UrlHD) {
                tracks.push({
                    title: "Bilibili HD (720P / 1080P)",
                    data: mp4UrlHD
                });
            }
        }
    }

    // 2. Quality 2: SD (360P / 480P)
    var playUrlSD = "https://api.bilibili.com/x/player/playurl?bvid=" + bvid + "&cid=" + cid + "&qn=16&platform=html5&high_format=1";
    var resSD = fetch(playUrlSD, { headers: HEADERS });
    if (resSD.ok) {
        var jsonSD = resSD.json();
        if (jsonSD && jsonSD.code === 0 && jsonSD.data && jsonSD.data.durl && jsonSD.data.durl.length) {
            var mp4UrlSD = jsonSD.data.durl[0].url || "";
            if (mp4UrlSD) {
                tracks.push({
                    title: "Bilibili Tiết Kiệm Dữ Liệu (360P / 480P)",
                    data: mp4UrlSD
                });
            }
        }
    }

    // 3. Desktop Embed Player
    var embedUrl = "https://player.bilibili.com/player.html?bvid=" + bvid + "&cid=" + cid + "&page=1&high_quality=1&danmaku=0";
    tracks.push({
        title: "Bilibili Web Player (Desktop Embed)",
        data: embedUrl
    });

    if (tracks.length === 0) return Response.error("No stream available");
    return Response.success(tracks);
}

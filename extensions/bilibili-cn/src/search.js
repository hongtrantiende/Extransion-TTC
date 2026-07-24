load('config.js');

function execute(key, page) {
    if (!page) page = "1";
    var searchUrl = "https://api.bilibili.com/x/web-interface/search/all/v2?keyword=" + encodeURIComponent(key) + "&page=" + page;

    var res = fetch(searchUrl, {
        headers: HEADERS
    });

    if (!res.ok) {
        searchUrl = "https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=" + encodeURIComponent(key) + "&page=" + page;
        res = fetch(searchUrl, { headers: HEADERS });
    }

    if (!res.ok) return Response.error("Search failed: " + res.status);

    var json = res.json();
    if (!json || json.code !== 0 || !json.data) {
        return Response.success([]);
    }

    var list = [];

    // Parse Search All V2 structure (videos, anime, bangumi, movies, stories)
    if (json.data.result && Array.isArray(json.data.result)) {
        var resArray = json.data.result;
        for (var r = 0; r < resArray.length; r++) {
            var cat = resArray[r];
            if (cat && cat.data && Array.isArray(cat.data)) {
                if (cat.result_type === 'video' || cat.result_type === 'media_bangumi' || cat.result_type === 'media_ft') {
                    list = list.concat(cat.data);
                }
            }
        }
    }

    // Direct list fallback
    if (list.length === 0) {
        if (json.data.result && Array.isArray(json.data.result)) list = json.data.result;
        else if (json.data.list && Array.isArray(json.data.list)) list = json.data.list;
    }

    if (!list || !list.length) return Response.success([]);

    var data = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var title = (item.title || item.org_title || "").replace(/<[^>]+>/g, "").trim();
        var bvid = item.bvid || "";
        var pic = item.pic || item.cover || "";
        if (pic.indexOf("//") === 0) pic = "https:" + pic;

        var link = bvid ? "https://www.bilibili.com/video/" + bvid : "";
        if (!link && item.aid) link = "https://www.bilibili.com/video/av" + item.aid;
        if (!link && item.goto_url) link = item.goto_url;

        if (link && title) {
            var authorName = item.author || (item.owner ? item.owner.name : "") || "";
            data.push({
                name: title,
                link: link,
                cover: pic,
                description: authorName ? ("UP: " + authorName) : "",
                host: BASE_URL,
                tag: item.typename || item.tname || ""
            });
        }
    }

    var nextPage = data.length > 0 ? String(parseInt(page) + 1) : null;
    return Response.success(data, nextPage);
}

load('config.js');

function execute(url, page) {
    if (!page) page = "1";
    var pNum = parseInt(page);
    var pageUrl = url.replace("{{page}}", page);

    var res = fetch(pageUrl, {
        headers: HEADERS
    });

    if (!res.ok) return Response.error("Cannot load: " + res.status);

    var json = res.json();
    if (!json || json.code !== 0 || !json.data) {
        return Response.error("Invalid response from Bilibili API");
    }

    var list = [];
    if (json.data.list && Array.isArray(json.data.list)) {
        list = json.data.list;
    } else if (json.data.result && Array.isArray(json.data.result)) {
        list = json.data.result;
    } else if (Array.isArray(json.data)) {
        list = json.data;
    }

    if (!list || !list.length) return Response.success([]);

    // If list is large (> 40 items, e.g. ranking API), slice it for page
    // If list is already page-sized (<= 40 items, e.g. popular/search API), use whole list
    var pagedList = list;
    var pageSize = 20;

    if (list.length > 40) {
        var startIndex = (pNum - 1) * pageSize;
        pagedList = list.slice(startIndex, startIndex + pageSize);
        if (pagedList.length === 0 && pNum === 1) pagedList = list;
    }

    var data = [];
    for (var i = 0; i < pagedList.length; i++) {
        var item = pagedList[i];
        var bvid = item.bvid || "";
        var title = (item.title || "").replace(/<[^>]+>/g, "").trim();
        var pic = item.pic || item.cover || "";
        if (pic.indexOf("//") === 0) pic = "https:" + pic;

        var link = bvid ? "https://www.bilibili.com/video/" + bvid : "";
        if (!link && item.aid) {
            link = "https://www.bilibili.com/video/av" + item.aid;
        }

        if (link && title) {
            var owner = item.author || (item.owner ? item.owner.name : "") || "";
            data.push({
                name: title,
                link: link,
                cover: pic,
                description: owner ? ("UP: " + owner) : "",
                host: BASE_URL,
                tag: item.typename || item.tname || ""
            });
        }
    }

    var hasMore = false;
    if (list.length > 40) {
        hasMore = (pNum * pageSize) < list.length;
    } else {
        hasMore = data.length >= 10;
    }

    var nextPage = hasMore ? String(pNum + 1) : null;
    return Response.success(data, nextPage);
}

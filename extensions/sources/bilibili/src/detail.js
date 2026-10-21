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
        apiUrl = "https://api.bilibili.com/x/web-interface/view?" + url;
    }

    var res = fetch(apiUrl, {
        headers: HEADERS
    });

    if (!res.ok) return Response.error("Cannot fetch video details: " + res.status);

    var json = res.json();
    if (!json || json.code !== 0 || !json.data) {
        return Response.error("Failed to load video info from Bilibili");
    }

    var data = json.data;
    var title = (data.title || "").trim();
    var pic = data.pic || "";
    if (pic.indexOf("//") === 0) pic = "https:" + pic;
    var author = data.owner ? (data.owner.name || "") : "";
    var desc = (data.desc || "").trim();

    return Response.success({
        name: title,
        cover: pic,
        host: BASE_URL,
        author: author,
        description: desc,
        ongoing: false,
        format: "series",
        genres: [],
        suggests: [],
        comments: []
    });
}

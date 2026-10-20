load('config.js');
load('util.js');

function formatTime(sec) {
    var n = parseInt(sec, 10);
    if (!n) return "";
    var d = new Date(n * 1000);
    var p = function (v) { return v < 10 ? "0" + v : "" + v; };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

function execute(url) {
    var res = fetch(url, { headers: HEADERS });
    if (!res || !res.ok) return Response.error("Cannot load article: " + (res ? res.status : "network"));

    var html = res.text();
    var data = getPageData(html) || {};
    var content = data.content || {};

    var doc = Html.parse(html);
    var h1 = doc.select("h1").first();
    var title = h1 ? h1.text() : (content.title || "");
    title = (title + "").replace(/^\s+|\s+$/g, "");
    if (!title) title = "Báo Mới";

    var ogImage = doc.select('meta[property="og:image"]').first();
    var metaDesc = doc.select('meta[name="description"]').first();
    var cover = ogImage ? (ogImage.attr("content") + "") : "";
    var desc = metaDesc ? (metaDesc.attr("content") + "") : "";

    var pub = content.publisher || {};
    var source = (pub.name || "") + "";
    var date = formatTime(content.date || content.publishedDate);

    var lines = [];
    if (desc) lines.push(escHtml(desc));
    if (source) lines.push("Nguồn: " + escHtml(source));
    if (date) lines.push("Đăng: " + date);

    return Response.success({
        name: title,
        cover: cover || (content.thumb || ""),
        host: BASE_URL,
        author: source || "Báo Mới",
        description: lines.join("<br>"),
        ongoing: false
    });
}

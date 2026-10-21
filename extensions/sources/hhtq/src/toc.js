function execute(url) {
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (!response.ok) {
        return Response.error("Lỗi kết nối");
    }

    var doc = Html.parse(response.text());
    var elements = doc.select(".ep-tile");
    var list = [];
    var seen = {};

    for (var i = 0; i < elements.size(); i++) {
        var el = elements.get(i);
        var href = el.attr("href");
        if (!href) continue;

        var key = href.split("?")[0];
        var name = el.text().trim();
        if (name && name.indexOf("Tập") !== 0) {
            name = "Tập " + name;
        }
        if (!name) {
            name = el.attr("aria-label") || "Tập phim";
        }

        var fullUrl = absoluteUrl(href);
        if (seen[key] === undefined) {
            seen[key] = list.length;
            list.push({ name: name, url: fullUrl });
        } else if (href.indexOf("server=vietsub") >= 0) {
            list[seen[key]].url = fullUrl;
        }
    }

    return Response.success(list);
}

function absoluteUrl(url) {
    if (!url) return "";
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return "https://hhtq.io" + (url.charAt(0) === "/" ? url : "/" + url);
}

function execute(input, page) {
    var currentPage = parseInt(page, 10) || 1;
    if (input.indexOf("today=1") >= 0 && currentPage > 1) {
        return Response.success([]);
    }

    var url = input;
    if (url.indexOf("page=") >= 0) {
        url = url.replace(/page=\d+/, "page=" + currentPage);
    } else if (currentPage > 1) {
        url += (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + currentPage;
    }

    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (!response.ok) {
        return Response.error("Lỗi kết nối");
    }

    var doc = Html.parse(response.text());
    var elements = doc.select(".film-card");
    var list = [];

    for (var i = 0; i < elements.size(); i++) {
        var el = elements.get(i);
        var link = el.attr("href");
        var title = el.select("h2").text();
        var cover = el.select("img").attr("src");
        var status = el.select(".film-count").text() || "Phim";

        if (title && link) {
            list.push({
                name: title.trim(),
                url: absoluteUrl(link),
                cover: absoluteUrl(cover),
                description: status.trim(),
                author: "HHTQ"
            });
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

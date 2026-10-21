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
    var name = doc.select("#film-title").text();
    var cover = doc.select(".detail-poster").attr("src");
    var description = doc.select(".film-description-full").text();
    if (!description) {
        description = doc.select("meta[name='description']").attr("content") || "";
    }
    var status = doc.select(".film-badges span").text();

    return Response.success({
        name: name.trim(),
        cover: absoluteUrl(cover),
        host: "https://hhtq.io",
        description: description.trim(),
        status: status.trim(),
        author: "HHTQ"
    });
}

function absoluteUrl(url) {
    if (!url) return "";
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return "https://hhtq.io" + (url.charAt(0) === "/" ? url : "/" + url);
}

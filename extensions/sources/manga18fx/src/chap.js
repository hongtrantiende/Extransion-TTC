load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
            "Referer": BASE_URL + "/"
        }
    });
    if (!response.ok) return null;

    var doc = response.html();
    var data = [];
    var seen = {};

    doc.select(".page-break img").forEach(function(img) {
        var src = img.attr("data-src") || img.attr("src") || "";
        if (!src || seen[src]) return;
        seen[src] = true;
        data.push({
            link: normalizeUrl(src)
        });
    });

    if (data.length === 0) {
        doc.select("img.loading").forEach(function(img) {
            var src = img.attr("data-src") || img.attr("src") || "";
            if (!src || seen[src]) return;
            seen[src] = true;
            data.push({
                link: normalizeUrl(src)
            });
        });
    }

    return Response.success(data);
}

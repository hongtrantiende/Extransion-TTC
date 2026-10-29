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

    doc.select("ul.row-content-chapter li").forEach(function(li) {
        var a = li.select("a.chapter-name").first() || li.select("a").first();
        if (!a) return;
        var href = normalizeUrl(a.attr("href"));
        var name = cleanText(a.text());
        if (!href || !name || seen[href]) return;
        seen[href] = true;

        var timeNode = li.select("span.chapter-time").first();
        var time = timeNode ? cleanText(timeNode.text()) : "";

        data.push({
            name: name,
            url: href,
            host: BASE_URL,
            description: time
        });
    });

    data.reverse();
    return Response.success(data);
}

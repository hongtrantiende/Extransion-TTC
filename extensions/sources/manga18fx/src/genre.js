load('config.js');

function execute() {
    var response = fetch(BASE_URL + "/", {
        headers: {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
            "Referer": BASE_URL + "/"
        }
    });
    if (!response.ok) return null;

    var doc = response.html();
    var seen = {};
    var genres = [];

    doc.select("a[href*='/manga-genre/']").each(function(i, e) {
        var href = normalizeUrl(e.attr("href"));
        var title = cleanText(e.text());
        if (!title || !href || seen[href]) return;
        seen[href] = true;
        genres.push({
            title: title,
            input: href,
            script: "gen.js"
        });
    });

    return Response.success(genres);
}

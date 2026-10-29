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
    var title = cleanText(doc.select("h1").first().text());
    if (!title) {
        title = cleanText(doc.select("meta[property='og:title']").attr("content"));
        title = title.replace(/ - Manga18fx$/i, "").replace(/^Read\s+/i, "").replace(/ Manhwa$/i, "").trim();
    }

    var cover = normalizeUrl(doc.select("meta[property='og:image']").attr("content"));
    var description = cleanText(doc.select("meta[property='og:description']").attr("content"));

    var author = "";
    var authorNode = doc.select(".author-content a").first();
    if (authorNode) author = cleanText(authorNode.text());

    var status = "";
    doc.select(".post-content_item").each(function(i, node) {
        if (status) return;
        var label = cleanText(node.select("h5").first().text());
        if (label.toLowerCase().indexOf("status") >= 0) {
            status = cleanText(node.select(".summary-content").first().text());
        }
    });

    var ongoing = status.toLowerCase().indexOf("ongoing") >= 0;

    var genres = [];
    var gseen = {};
    doc.select(".genres-content a").each(function(i, e) {
        var href = normalizeUrl(e.attr("href"));
        var title2 = cleanText(e.text());
        if (!title2 || !href || gseen[href]) return;
        gseen[href] = true;
        genres.push({
            title: title2,
            input: href,
            script: "gen.js"
        });
    });

    var infoLines = [];
    if (author) infoLines.push("Author: " + author);
    if (status) infoLines.push("Status: " + status);

    return Response.success({
        name: title,
        cover: cover,
        author: author,
        description: description,
        detail: infoLines.join("<br>"),
        ongoing: ongoing,
        genres: genres,
        host: BASE_URL
    });
}

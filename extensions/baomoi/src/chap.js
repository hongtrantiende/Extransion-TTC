load('config.js');
load('util.js');

function extractBody(doc) {
    var body = doc.select(".content-body").first();
    if (!body) return "";

    var parts = [];
    var els = body.select("h2,h3,h4,p,blockquote,li");
    for (var i = 0; i < els.size(); i++) {
        var el = els.get(i);
        var text = (el.text() || "") + "";
        text = text.replace(/^\s+|\s+$/g, "");
        if (!text) continue;

        parts.push("<p>" + escHtml(text) + "</p>");
    }
    return parts.join("\n");
}

function execute(url) {
    var res = fetch(url, { headers: HEADERS });
    if (!res || !res.ok) return Response.error("Cannot load article: " + (res ? res.status : "network"));

    var html = res.text();
    var doc = Html.parse(html);
    var parts = [];

    var descEl = doc.select('meta[name="description"]').first();
    if (descEl && descEl.attr("content")) {
        parts.push("<p><em>" + escHtml(descEl.attr("content")) + "</em></p>");
    }

    var body = extractBody(doc);
    if (body) parts.push(body);
    if (!parts.length) return Response.error("Empty content");

    return Response.success(parts.join("\n"));
}

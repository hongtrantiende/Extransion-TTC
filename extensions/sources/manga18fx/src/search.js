load('config.js');

function execute(key, page) {
    if (!page) page = "1";
    var keyword = (key || "").trim();
    if (!keyword) return Response.success([]);

    var requestUrl = BASE_URL + "/search?q=" + encodeURIComponent(keyword);
    if (page && page !== "1") {
        requestUrl += "&page=" + page;
    }

    var response = fetch(requestUrl, {
        headers: {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
            "Referer": BASE_URL + "/"
        }
    });
    if (!response.ok) return null;

    var doc = response.html();
    var data = parseStoryCards(doc);
    var next = getNextPage(doc, page);
    return Response.success(data, next);
}

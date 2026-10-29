load('config.js');

function execute(url, page) {
    if (!page) page = "1";
    var requestUrl = buildPagedUrl(url, page);
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

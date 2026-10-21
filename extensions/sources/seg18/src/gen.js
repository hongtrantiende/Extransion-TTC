load('config.js');
load('util.js');

function execute(url, page) {
    if (!page) page = "1";
    var pageUrl = (url + "").replace("{{page}}", page);

    if (pageUrl.indexOf(API_URL) === 0) {
        var result = fetchMovieList(pageUrl);
        if (!result) return Response.error("Cannot load list");
        return Response.success(result.list, result.next);
    }

    var res = fetch(pageUrl, { headers: SITE_HEADERS });
    if (!res || !res.ok) return Response.error("Cannot load list");
    var parsed = parseSiteList(res.text(), page);
    return Response.success(parsed.list, parsed.next);
}

load('config.js');
load('util.js');

function execute(url, page) {
    var res = fetch(url, { headers: HEADERS });
    if (!res || !res.ok) return Response.error("Cannot load feed: " + (res ? res.status : "network"));

    var data = getPageData(res.text());
    if (!data) return Response.error("Invalid feed data");

    return Response.success(extractItems(data), null);
}

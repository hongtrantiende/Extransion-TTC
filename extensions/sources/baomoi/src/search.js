load('config.js');
load('util.js');

function execute(key, page) {
    var keyword = (key + "").replace(/^\s+|\s+$/g, "");
    if (!keyword) return Response.success([]);

    var url = BASE_URL + "/tim-kiem/" + encodeURIComponent(keyword) + ".epi";
    var res = fetch(url, { headers: HEADERS });
    if (!res || !res.ok) return Response.error("Search failed");

    var data = getPageData(res.text());
    if (!data) return Response.error("Invalid search data");

    return Response.success(extractItems(data), null);
}

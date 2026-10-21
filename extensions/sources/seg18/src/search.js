load('config.js');
load('util.js');

function execute(key, page) {
    if (!page) page = "1";
    var keyword = (key + "").trim();
    if (!keyword) return Response.success([]);

    var url = API_URL + "/movies/search?q=" + encodeURIComponent(keyword) + "&page=" + page;
    var result = fetchMovieList(url);
    if (!result) return Response.error("Search failed");
    return Response.success(result.list, result.next);
}

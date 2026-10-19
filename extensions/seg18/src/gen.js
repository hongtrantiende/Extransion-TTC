load('config.js');
load('util.js');

function execute(url, page) {
    if (!page) page = "1";
    var pageUrl = (url + "").replace("{{page}}", page);
    var result = fetchMovieList(pageUrl);
    if (!result) return Response.error("Cannot load list");
    return Response.success(result.list, result.next);
}

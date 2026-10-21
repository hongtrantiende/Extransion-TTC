load('config.js');
load('util.js');

function execute(url) {
    var label = "Xem phim";
    var res = fetch(url, { headers: HEADERS });
    if (res && res.ok) {
        var json = res.json();
        var item = (json && json.data) || null;
        if (item && item.quality) label = "Xem phim • " + item.quality;
    }
    return Response.success([{ name: label, url: url, host: BASE_URL }]);
}

load('config.js');
load('util.js');

function execute(url) {
    var res = fetch(url, { headers: HEADERS });
    if (!res || !res.ok) return Response.error("Cannot load: " + (res ? res.status : "network"));
    var json = res.json();
    var item = (json && json.data) || null;
    if (!item) return Response.error("Invalid data");

    var sources = item.sources || [];
    var tracks = [];
    for (var i = 0; i < sources.length; i++) {
        var s = sources[i] || {};
        var link = s.link || "";
        if (!link) continue;
        var title = "Server " + (i + 1);
        if (s.type) title += " (" + s.type + ")";
        tracks.push({ title: title, data: link });
    }

    if (!tracks.length) return Response.error("No stream found");
    return Response.success(tracks);
}

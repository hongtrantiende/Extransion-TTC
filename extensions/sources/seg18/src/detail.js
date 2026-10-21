load('config.js');
load('util.js');

function execute(url) {
    var res = fetch(url, { headers: HEADERS });
    if (!res || !res.ok) return Response.error("Cannot load: " + (res ? res.status : "network"));
    var json = res.json();
    var item = (json && json.data) || null;
    if (!item) return Response.error("Invalid data");

    var trans = pickTrans(item);
    var lines = [];
    if (item.quality) lines.push("Chất lượng: " + item.quality);
    if (item.duration) lines.push("Thời lượng: " + item.duration);
    if (item.publish_at) lines.push("Đăng: " + (item.publish_at + "").replace("T", " ").substring(0, 19));

    var genres = [];
    var rawGenres = item.genres || [];
    for (var i = 0; i < rawGenres.length; i++) {
        var g = transName(rawGenres[i]);
        if (g) genres.push(g);
    }
    if (genres.length) lines.push("Thể loại: " + genres.join(", "));

    var countries = [];
    var chips = [];
    var rawCountries = item.countries || [];
    for (var j = 0; j < rawCountries.length; j++) {
        var c = rawCountries[j];
        if (!c) continue;
        var cname = transName(c);
        if (cname) countries.push(cname);
        if (c.code) {
            chips.push({
                title: cname || c.code,
                input: API_URL + "/countries/" + c.code + "/movies?page={{page}}",
                script: "gen.js"
            });
        }
    }
    if (countries.length) lines.push("Quốc gia: " + countries.join(", "));

    var actors = [];
    var rawActors = item.actors || [];
    for (var k = 0; k < rawActors.length; k++) {
        var a = rawActors[k];
        if (!a) continue;
        var aname = a.title || a.name || transName(a);
        if (aname) actors.push(aname);
    }
    if (actors.length) lines.push("Diễn viên: " + actors.join(", "));

    return Response.success({
        name: (trans.title || item.code || "SEG 18") + "",
        cover: (item.poster || item.thumbnail || item.backdrop || "") + "",
        host: BASE_URL,
        author: "Topxx.vip",
        description: lines.join("<br>"),
        ongoing: false,
        format: "series",
        genres: chips
    });
}

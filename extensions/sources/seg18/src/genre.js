load('config.js');
load('util.js');

function mainGenreName(code, fallback) {
    if (code === "NMf5df5FMg") return "Việt Sub";
    if (code === "vQMGvwTw5G") return "JAV";
    if (code === "vdDkXwQsHi") return "Không che";
    return fallback;
}

function execute() {
    var list = [];

    var genres = [];
    var gres = fetch(API_URL + "/genres?main_only=1&per_page=200", { headers: HEADERS });
    if (gres && gres.ok) {
        var gj = gres.json();
        genres = (gj && gj.data) || [];
    }
    if (!genres.length) {
        genres = [
            { code: "NMf5df5FMg", movies_count: 1236 },
            { code: "vQMGvwTw5G", movies_count: 2502 },
            { code: "vdDkXwQsHi", movies_count: 1121 }
        ];
    }
    for (var i = 0; i < genres.length; i++) {
        var g = genres[i];
        if (!g || !g.code) continue;
        var label = mainGenreName(g.code, transName(g) || g.code);
        var count = g.movies_count || 0;
        list.push({
            title: label + (count ? " (" + count + ")" : ""),
            input: API_URL + "/genres/" + g.code + "/movies?page={{page}}",
            script: "gen.js"
        });
    }

    var cres = fetch(API_URL + "/countries", { headers: HEADERS });
    if (cres && cres.ok) {
        var cj = cres.json();
        var items = (cj && cj.data) || [];
        var rows = [];
        for (var j = 0; j < items.length; j++) {
            var c = items[j];
            if (!c || !c.code) continue;
            var ccount = c.movies_count || 0;
            if (ccount <= 0) continue;
            rows.push({ name: transName(c) || c.code, count: ccount, code: c.code });
        }
        rows.sort(function (a, b) { return b.count - a.count; });
        for (var k = 0; k < rows.length; k++) {
            list.push({
                title: rows[k].name + " (" + rows[k].count + ")",
                input: API_URL + "/countries/" + rows[k].code + "/movies?page={{page}}",
                script: "gen.js"
            });
        }
    } else {
        var fallback = [["Nhật Bản", "jp"], ["Việt Nam", "vn"], ["Trung Quốc", "cn"], ["Mỹ", "us"]];
        for (var m = 0; m < fallback.length; m++) {
            list.push({
                title: fallback[m][0],
                input: API_URL + "/countries/" + fallback[m][1] + "/movies?page={{page}}",
                script: "gen.js"
            });
        }
    }

    var extras = [
        ["Hentai", "hentai"],
        ["Tập thể", "tap-the"],
        ["Amateur", "amateur"],
        ["Hàn Quốc", "han-quoc"],
        ["Sex less", "sex-less"],
        ["Chubby", "chubby"],
        ["Sex tự quay", "sex-tu-quay"],
        ["Xnxx", "xnxx"],
        ["Vú to", "big-tits"]
    ];
    for (var n = 0; n < extras.length; n++) {
        list.push({
            title: extras[n][0],
            input: BASE_URL + "/genre/" + extras[n][1] + "?page={{page}}",
            script: "gen.js"
        });
    }

    return Response.success(list);
}

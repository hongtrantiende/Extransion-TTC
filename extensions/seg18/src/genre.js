load('config.js');
load('util.js');

function execute() {
    var list = [];
    var res = fetch(API_URL + "/countries", { headers: HEADERS });

    if (res && res.ok) {
        var json = res.json();
        var items = (json && json.data) || [];
        var rows = [];
        for (var i = 0; i < items.length; i++) {
            var c = items[i];
            if (!c || !c.code) continue;
            var count = c.movies_count || 0;
            if (count <= 0) continue;
            rows.push({ name: transName(c) || c.code, count: count, code: c.code });
        }
        rows.sort(function (a, b) { return b.count - a.count; });
        for (var j = 0; j < rows.length; j++) {
            list.push({
                title: rows[j].name + " (" + rows[j].count + ")",
                input: API_URL + "/countries/" + rows[j].code + "/movies?page={{page}}",
                script: "gen.js"
            });
        }
    }

    if (!list.length) {
        var fallback = [["Nhật Bản", "jp"], ["Việt Nam", "vn"], ["Trung Quốc", "cn"], ["Mỹ", "us"]];
        for (var k = 0; k < fallback.length; k++) {
            list.push({
                title: fallback[k][0],
                input: API_URL + "/countries/" + fallback[k][1] + "/movies?page={{page}}",
                script: "gen.js"
            });
        }
    }

    return Response.success(list);
}

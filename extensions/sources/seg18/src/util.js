function pickTrans(item) {
    var trans = (item && item.trans) || [];
    for (var i = 0; i < trans.length; i++) {
        if (trans[i] && trans[i].locale === "vi" && trans[i].title) return trans[i];
    }
    for (var j = 0; j < trans.length; j++) {
        if (trans[j] && trans[j].title) return trans[j];
    }
    return { title: "" };
}

function transName(obj) {
    var trans = (obj && (obj.trans || obj.translations)) || [];
    for (var i = 0; i < trans.length; i++) {
        if (trans[i] && trans[i].locale === "vi" && trans[i].name) return trans[i].name;
    }
    for (var j = 0; j < trans.length; j++) {
        if (trans[j] && trans[j].name) return trans[j].name;
    }
    return "";
}

function mapMovie(item) {
    var trans = pickTrans(item);
    var names = [];
    var rawGenres = item.genres || [];
    for (var i = 0; i < rawGenres.length; i++) {
        var g = transName(rawGenres[i]);
        if (g) names.push(g);
    }
    var bits = [];
    if (item.quality) bits.push(item.quality);
    if (item.duration) bits.push(item.duration);
    if (names.length) bits.push(names.join(", "));

    return {
        name: (trans.title || item.code || "") + "",
        link: API_URL + "/movies/" + item.code,
        cover: (item.poster || item.thumbnail || item.backdrop || "") + "",
        description: bits.join(" • "),
        host: BASE_URL,
        tag: (item.quality || "") + ""
    };
}

function fetchMovieList(pageUrl) {
    var res = fetch(pageUrl, { headers: HEADERS });
    if (!res || !res.ok) return null;
    var json = res.json();
    if (!json) return null;

    var items = json.data || [];
    var meta = json.meta || {};
    var list = [];
    for (var i = 0; i < items.length; i++) {
        if (items[i] && items[i].code) list.push(mapMovie(items[i]));
    }

    var next = null;
    if (meta.current_page && meta.last_page && meta.current_page < meta.last_page) {
        next = String(meta.current_page + 1);
    }
    return { list: list, next: next };
}

function decodeHtml(s) {
    s = (s === null || s === undefined) ? "" : s + "";
    return s
        .replace(/&#0*39;/g, "'")
        .replace(/&#x27;/gi, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&");
}

function attrOf(tag, name) {
    var m = (tag || "").match(new RegExp(name + '="([^"]*)"'));
    return m ? decodeHtml(m[1]) : "";
}

function parseSiteList(html, page) {
    var list = [];
    var src = (html || "") + "";
    var start = src.indexOf('<table id="list-movies"');
    var end = start >= 0 ? src.indexOf("</table>", start) : -1;
    var scope = (start >= 0 && end > start) ? src.substring(start, end) : src;

    var chunks = scope.split('<tr class="tpx-row');
    for (var i = 1; i < chunks.length; i++) {
        var row = chunks[i];

        var anchor = row.match(/<a[^>]+class="tpx-titleLink"[^>]*>/);
        if (!anchor) continue;
        var name = attrOf(anchor[0], "title");
        if (!name) continue;

        var code = "";
        var subs = row.match(/<div class="tpx-sub[^"]*">\s*\(([\s\S]*?)\)\s*<\/div>/g) || [];
        for (var j = 0; j < subs.length; j++) {
            var text = subs[j].replace(/<[^>]*>/g, "");
            text = text.replace(/^\s*\(/, "").replace(/\)\s*$/, "");
            text = text.replace(/^\s+|\s+$/g, "");
            if (/^[A-Za-z0-9-]{8,64}$/.test(text)) code = text;
        }
        if (!code) continue;

        var img = row.match(/<img[^>]+src="([^"]+)"/);
        var dur = row.match(/<span class="tpx-time[^"]*">\s*([^<]*?)\s*<\/span>/);

        list.push({
            name: name,
            link: API_URL + "/movies/" + code,
            cover: img ? decodeHtml(img[1]) : "",
            description: dur ? ("Thời lượng: " + dur[1]) : "",
            host: BASE_URL,
            tag: dur ? dur[1] : ""
        });
    }

    var maxPage = 0;
    var re = /\?page=(\d+)/g;
    var m;
    while ((m = re.exec(src)) !== null) {
        var n = parseInt(m[1], 10);
        if (n > maxPage) maxPage = n;
    }
    var current = parseInt(page, 10) || 1;
    return { list: list, next: maxPage > current ? String(current + 1) : null };
}

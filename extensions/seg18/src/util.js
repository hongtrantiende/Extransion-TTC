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

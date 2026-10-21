// wbi.js — Bilibili WBI signing for signed web APIs (view / search)
// Requires: config.js (HEADERS) and cryptojs.js (CryptoJS.MD5) loaded first.
// Bilibili risk control returns 412 "request was banned" on plain endpoints
// for flagged IPs; signed endpoints pass normally.

var BILI_MIXIN_KEY_ENC_TAB = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61,
    26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36,
    20, 34, 44, 52
];

function biliGetMixinKey(orig) {
    var temp = [];
    for (var i = 0; i < 64; i++) {
        temp.push(orig.charAt(BILI_MIXIN_KEY_ENC_TAB[i]));
    }
    return temp.join("").substring(0, 32);
}

function biliGetWbiKeys() {
    var nav = fetch("https://api.bilibili.com/x/web-interface/nav", { headers: HEADERS });
    if (!nav.ok) return null;
    var json = nav.json();
    if (!json || !json.data || !json.data.wbi_img) return null;
    var imgUrl = (json.data.wbi_img.img_url || "") + "";
    var subUrl = (json.data.wbi_img.sub_url || "") + "";
    var imgKey = imgUrl.substring(imgUrl.lastIndexOf("/") + 1).split(".")[0];
    var subKey = subUrl.substring(subUrl.lastIndexOf("/") + 1).split(".")[0];
    if (!imgKey || !subKey) return null;
    return { imgKey: imgKey, subKey: subKey };
}

function biliSignQuery(params, imgKey, subKey) {
    var mixinKey = biliGetMixinKey(imgKey + subKey);
    params.wts = Math.round(new Date().getTime() / 1000);
    var keys = [];
    for (var k in params) {
        if (params.hasOwnProperty(k)) keys.push(k);
    }
    keys.sort();
    var parts = [];
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i] + "";
        var value = String(params[keys[i]]).replace(/[!'()*]/g, "");
        parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
    var query = parts.join("&");
    return query + "&w_rid=" + CryptoJS.MD5(query + mixinKey).toString();
}

// path: "/x/web-interface/wbi/view" etc. Returns fetch response or null.
function biliFetchWbi(path, params) {
    var keys = biliGetWbiKeys();
    if (!keys) return null;
    var query = biliSignQuery(params, keys.imgKey, keys.subKey);
    return fetch("https://api.bilibili.com" + path + "?" + query, { headers: HEADERS });
}

// Resolves canonical bvid + first-page cid for a video (bvid or aid input).
// pagelist works even where the plain view API is banned; wbi/view is the fallback.
function biliResolveVideo(bvid, aid) {
    var out = { bvid: bvid || "", cid: "" };

    if (out.bvid) {
        var pl = fetch("https://api.bilibili.com/x/player/pagelist?bvid=" + out.bvid, { headers: HEADERS });
        if (pl.ok) {
            var pj = pl.json();
            if (pj && pj.code === 0 && pj.data && pj.data.length) {
                out.cid = (pj.data[0].cid || "") + "";
            }
        }
    }

    if (!out.cid || !out.bvid) {
        var params = out.bvid ? { bvid: out.bvid } : (aid ? { aid: aid } : null);
        if (params) {
            var res = biliFetchWbi("/x/web-interface/wbi/view", params);
            if (res && res.ok) {
                var json = res.json();
                if (json && json.code === 0 && json.data) {
                    out.bvid = (json.data.bvid || out.bvid) + "";
                    out.cid = (json.data.cid || out.cid) + "";
                }
            }
        }
    }

    return out;
}

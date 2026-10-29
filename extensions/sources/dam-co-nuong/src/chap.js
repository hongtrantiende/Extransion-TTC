var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
load('config.js');

function sha256Bytes(str) {
    var md = java.security.MessageDigest.getInstance("SHA-256");
    return md.digest(new java.lang.String(str).getBytes("UTF-8"));
}

function hmacSha256(keyBytes, dataBytes) {
    var mac = javax.crypto.Mac.getInstance("HmacSHA256");
    mac.init(new javax.crypto.spec.SecretKeySpec(keyBytes, "HmacSHA256"));
    return mac.doFinal(dataBytes);
}

function toBytes(str) {
    return new java.lang.String(str).getBytes("UTF-8");
}

function decryptPages(cipherPath, b64e) {
    var input36 = java.util.Base64.getDecoder().decode("YVdGuT8RjDWkeQjt7s7mv53smMpLrcKBuGMs8erg8Bs=");

    var H1 = hmacSha256(input36, toBytes("tok"));
    var H2 = hmacSha256(input36, toBytes("enc"));

    var tokenData = hmacSha256(H1, toBytes(cipherPath));

    var bb = java.nio.ByteBuffer.allocate(17);
    bb.put(0, 1);
    for (var i = 0; i < 16; i++) bb.put(i + 1, tokenData[i]);
    var tokenBytes = bb.array();
    var token = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

    var parts = cipherPath.split("/");
    var slug = parts[0];
    var chapter = parts.slice(1).join("/");
    var fetchUrl = BASE_URL + "/_c/mangas/" + slug + "/chapters/" + chapter + "/pages?_=" + encodeURIComponent(token);

    var response = fetch(fetchUrl, {
        headers: {
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": USER_AGENT
        }
    });
    if (!response.ok) return null;

    var payload = response.json();
    var b64 = payload.e;

    var keyBytes = hmacSha256(H2, toBytes(token));

    var allBytes = java.util.Base64.getUrlDecoder().decode(b64);
    var iv = java.util.Arrays.copyOfRange(allBytes, 0, 12);
    var ct = java.util.Arrays.copyOfRange(allBytes, 12, allBytes.length);

    var keySpec = new javax.crypto.spec.SecretKeySpec(keyBytes, "AES");
    var gcmSpec = new javax.crypto.spec.GCMParameterSpec(128, iv);
    var cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(javax.crypto.Cipher.DECRYPT_MODE, keySpec, gcmSpec);
    cipher.updateAAD(toBytes(cipherPath));
    var pt = cipher.doFinal(ct);
    return new java.lang.String(pt, "UTF-8");
}

function execute(url) {
    url = normalizeUrl(url);

    var matched = /\/truyen\/(.+)/i.exec(url);
    if (!matched) return null;

    var cipherPath = matched[1].replace(/\/+$/, "");
    if (!cipherPath) return null;

    try {
        var plain = decryptPages(cipherPath, null);
        var parsed = JSON.parse(plain);
        var data = parsed.p || parsed;
        var result = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i]) {
                result.push({
                    link: data[i]
                });
            }
        }
        return Response.success(result);
    } catch (e) {
        return Response.success("ERR=" + e);
    }
}

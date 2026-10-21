load('config.js');

function execute() {
    return Response.success([
        { title: "Mới nhất", input: API_URL + "/movies/latest?page={{page}}", script: "gen.js" },
        { title: "Việt Sub", input: API_URL + "/genres/NMf5df5FMg/movies?page={{page}}", script: "gen.js" },
        { title: "JAV", input: API_URL + "/genres/vQMGvwTw5G/movies?page={{page}}", script: "gen.js" },
        { title: "Không che", input: API_URL + "/genres/vdDkXwQsHi/movies?page={{page}}", script: "gen.js" },
        { title: "Việt Nam", input: API_URL + "/countries/vn/movies?page={{page}}", script: "gen.js" },
        { title: "Nhật Bản", input: API_URL + "/countries/jp/movies?page={{page}}", script: "gen.js" },
        { title: "Trung Quốc", input: API_URL + "/countries/cn/movies?page={{page}}", script: "gen.js" },
        { title: "Mỹ", input: API_URL + "/countries/us/movies?page={{page}}", script: "gen.js" },
        { title: "Nga", input: API_URL + "/countries/ru/movies?page={{page}}", script: "gen.js" },
        { title: "Tây Ban Nha", input: API_URL + "/countries/es/movies?page={{page}}", script: "gen.js" },
        { title: "Hentai", input: BASE_URL + "/genre/hentai?page={{page}}", script: "gen.js" },
        { title: "Tập thể", input: BASE_URL + "/genre/tap-the?page={{page}}", script: "gen.js" },
        { title: "Amateur", input: BASE_URL + "/genre/amateur?page={{page}}", script: "gen.js" },
        { title: "Hàn Quốc", input: BASE_URL + "/genre/han-quoc?page={{page}}", script: "gen.js" },
        { title: "Sex less", input: BASE_URL + "/genre/sex-less?page={{page}}", script: "gen.js" },
        { title: "Chubby", input: BASE_URL + "/genre/chubby?page={{page}}", script: "gen.js" },
        { title: "Sex tự quay", input: BASE_URL + "/genre/sex-tu-quay?page={{page}}", script: "gen.js" },
        { title: "Xnxx", input: BASE_URL + "/genre/xnxx?page={{page}}", script: "gen.js" },
        { title: "Vú to", input: BASE_URL + "/genre/big-tits?page={{page}}", script: "gen.js" }
    ]);
}

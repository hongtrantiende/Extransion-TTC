load('config.js');

function execute() {
    return Response.success([
        { title: "Mới nhất", input: API_URL + "/movies/latest?page={{page}}", script: "gen.js" },
        { title: "Nhật Bản", input: API_URL + "/countries/jp/movies?page={{page}}", script: "gen.js" },
        { title: "Việt Nam", input: API_URL + "/countries/vn/movies?page={{page}}", script: "gen.js" },
        { title: "Trung Quốc", input: API_URL + "/countries/cn/movies?page={{page}}", script: "gen.js" },
        { title: "Mỹ", input: API_URL + "/countries/us/movies?page={{page}}", script: "gen.js" }
    ]);
}

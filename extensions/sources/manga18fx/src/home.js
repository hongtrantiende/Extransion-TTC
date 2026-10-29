load('config.js');

function execute() {
    return Response.success([
        {title: "Mới cập nhật", input: BASE_URL + "/", script: "gen.js"},
        {title: "Hot", input: BASE_URL + "/hot-manga", script: "gen.js"},
        {title: "Manhwa", input: BASE_URL + "/manga-genre/manhwa", script: "gen.js"},
        {title: "Manhua", input: BASE_URL + "/manga-genre/manhua", script: "gen.js"},
        {title: "Uncensored Manhwa", input: BASE_URL + "/manga-genre/uncensored-manhwa", script: "gen.js"},
        {title: "Action", input: BASE_URL + "/manga-genre/action", script: "gen.js"},
        {title: "Adventure", input: BASE_URL + "/manga-genre/adventure", script: "gen.js"},
        {title: "Comedy", input: BASE_URL + "/manga-genre/comedy", script: "gen.js"},
        {title: "Drama", input: BASE_URL + "/manga-genre/drama", script: "gen.js"},
        {title: "Ecchi", input: BASE_URL + "/manga-genre/ecchi", script: "gen.js"},
        {title: "Fantasy", input: BASE_URL + "/manga-genre/fantasy", script: "gen.js"},
        {title: "Harem", input: BASE_URL + "/manga-genre/harem", script: "gen.js"},
        {title: "Isekai", input: BASE_URL + "/manga-genre/isekai", script: "gen.js"},
        {title: "Mature", input: BASE_URL + "/manga-genre/mature", script: "gen.js"},
        {title: "Mystery", input: BASE_URL + "/manga-genre/mystery", script: "gen.js"},
        {title: "Psychological", input: BASE_URL + "/manga-genre/psychological", script: "gen.js"},
        {title: "Romance", input: BASE_URL + "/manga-genre/romance", script: "gen.js"},
        {title: "School Life", input: BASE_URL + "/manga-genre/school-life", script: "gen.js"},
        {title: "Seinen", input: BASE_URL + "/manga-genre/seinen", script: "gen.js"},
        {title: "Shoujo", input: BASE_URL + "/manga-genre/shoujo", script: "gen.js"},
        {title: "Shounen", input: BASE_URL + "/manga-genre/shounen", script: "gen.js"},
        {title: "Supernatural", input: BASE_URL + "/manga-genre/supernatural", script: "gen.js"},
        {title: "Thriller", input: BASE_URL + "/manga-genre/thriller", script: "gen.js"},
        {title: "Tragedy", input: "/manga-genre/tragedy", script: "gen.js"},
        {title: "Reincarnation", input: BASE_URL + "/manga-genre/reincarnation", script: "gen.js"}
    ]);
}

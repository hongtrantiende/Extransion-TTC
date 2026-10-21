load('config.js');

function execute() {
    var list = [];
    for (var i = 0; i < CATEGORIES.length; i++) {
        list.push({
            title: CATEGORIES[i][0],
            input: categoryUrl(CATEGORIES[i][1]),
            script: "gen.js"
        });
    }
    return Response.success(list);
}

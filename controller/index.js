exports.entry = function (req, res) {
    res.render('index.ejs', {data: require('../__siteDB.json')});
};

exports.getMarkdownFile = function (req, res) {
    var query = req.query,
        DB = require('../__siteDB.json');

    if (query.type && !Number.isNaN(Number(query.index))) {
        DB[query.type][query.index] ?
            res.json(DB[query.type][query.index]) :
            res.json({"status": "failed", "msg": "没有找到文章！", "param": query});
    }
    else {
        res.json({"status": "failed", "msg": "参数不正确！", "param": query});
    }
};
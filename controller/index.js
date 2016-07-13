const HEXO_PATH = require('../config');

var path = require('path'),
    fs = require('fs'),
    getAllData = require('../module/getAllData');


exports.entry = function (req, res) {
    deleteDBCache();
    res.render('index.ejs', {data: require('../__siteDB.json')});
};

exports.getMarkdownFile = function (req, res) {
    deleteDBCache();
    var query = req.query,
        DB = require('../__siteDB.json');

    if (isParamValid(query)) {
        DB[query.type][query.index] ?
            res.json(DB[query.type][query.index]) :
            res.status(500).send({"type": "error", "msg": "没有找到文章！", "param": query});
    }
    else {
        res.status(500).send({"type": "error", "msg": "参数不正确！", "param": query});
    }
};

exports.getConfig = function (req, res) {
    deleteDBCache();
    var query = req.query,
        DB = require('../__siteDB.json');

    if (query.type.search(/site|theme/) === -1) {
        res.status(500).send({"msg": "类型不正确！", "param": query});
    }
    else if (query.type == 'site') {
        res.json(DB.siteConfig);
    }
    else if (query.type = 'theme') {
        res.json(DB.themeConfig);
    }
};

exports.writeMarkdownFile = function (req, res) {
    deleteDBCache();
    var body = req.body,
        DB = require('../__siteDB.json');

    if (isParamValid(body)) {
        var file_in_DB = DB[body.type][body.index],
            file_name = file_in_DB.file_name,
            file_path;

        body.type === 'pages' ?
            file_path = path.join(HEXO_PATH.sourcePath, file_in_DB.page_url, file_name) :
            file_path = path.join(HEXO_PATH.sourcePath, '_' + body.type, file_name);

        fs.writeFile(file_path, body.content, 'utf-8', function (err) {
            if (err) {
                res.status(500).send({status: 'error', msg: 'file write err!'});
                throw err;
            }

            getAllData.updateDBFile();
            res.json({status: 'success'});
        });
    }
    else {
        res.status(500).send({status: 'error', msg: '参数不正确！'});
    }
};

function isParamValid(param) {
    return param.type && !Number.isNaN(Number(param.index));
}

function deleteDBCache() {
    delete require.cache[path.join(HEXO_PATH.adminPath, '__siteDB.json')];
}
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

    if (query.type && !Number.isNaN(Number(query.index))) {
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
        DB = require('../__siteDB.json'),
        file_in_DB, file_name, file_path,
        file_type = body.type,
        file_index = body.index,
        file_content = body.content;

    if (body !== undefined && body !== null) {
        // 如果有index属性，表示是更新现有的文件，否则表示新增文件
        if (file_index) {
            file_in_DB = DB[file_type][file_index];
            file_name = file_in_DB.file_name;

            file_type === 'pages' ?
                file_path = path.join(HEXO_PATH.sourcePath, file_in_DB.page_url, file_name) :
                file_path = path.join(HEXO_PATH.sourcePath, '_' + file_type, file_name);

            writeFile(file_path);
        }
        else {
            file_name = body.file_name;

            if (file_type === 'pages') {
                file_path = path.join(HEXO_PATH.sourcePath, file_name);

                fs.access(file_path, fs.F_OK, function (err) {
                    if (err) {
                        try {
                            fs.mkdirSync(file_path);
                            file_path = path.join(file_path, 'index.md');
                            writeFile(file_path);
                        }
                        catch (e) {
                            throw 'create path failed:' + file_path;
                        }
                    }
                    else {
                        res.status(500).send({status: 'error', msg: '路径:' + file_name + ' 已存在'});
                    }
                });
            }

            else if (file_type === 'posts' || file_type === 'drafts') {
                file_path = path.join(HEXO_PATH[file_type.replace(/s$/, '') + 'Path'], file_name + '.md');

                fs.access(file_path, fs.F_OK, function (err) {
                    if (err) {
                        writeFile(file_path);
                    }
                    else {
                        res.status(500).send({status: 'error', msg: '文件:' + file_name + '.md 已存在'});
                    }
                });
            }
        }

        function writeFile(filePath) {
            fs.writeFile(filePath, file_content, 'utf-8', function (err) {
                if (err) {
                    res.status(500).send({status: 'error', msg: 'file write err!'});
                    throw err;
                }

                getAllData.updateDBFile();
                res.json({status: 'success'});
            });
        }
    }
    else {
        res.status(500).send({status: 'error', msg: '没有收到参数！'});
    }
};

function deleteDBCache() {
    delete require.cache[path.join(HEXO_PATH.adminPath, '__siteDB.json')];
}
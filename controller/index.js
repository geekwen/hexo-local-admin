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

exports.moveMarkdownFile = function (req, res) {
    deleteDBCache();

    var body = req.body,
        type = body.type,
        index = body.index,
        target_type = body.target_type.replace(/s$/, ''),
        DB = require('../__siteDB.json'),
        file = DB[type][index];

    console.log(body);

    if (!file) {
        res.status(500).send({"status": "error", "msg": "DB中没有找到该文章！"});
        return;
    }

    var file_name, oldPath, newPath;

    switch (type) {
        case 'pages':
            file_name = file.page_url + '.md';
            oldPath = path.join(HEXO_PATH.sourcePath, file.page_url, 'index.md');
            newPath = path.join(HEXO_PATH[target_type + 'Path'], file_name);

            fs.access(
                newPath,
                fs.F_OK,
                function (err) {
                    if (!err) {
                        res.status(500).send({"status": "error", "msg": target_type + "中存在同名文件！"});
                        return;
                    }

                    moveFile(
                        oldPath,
                        newPath,

                        // 移动完成后，需要删除原来的空文件夹
                        function () {
                            var pathToRm = path.join(HEXO_PATH.sourcePath, file.page_url);
                            fs.rmdir(
                                pathToRm,
                                function (err) {
                                    if (err) throw 'delete dir:' + pathToRm + ' failed';
                                }
                            );
                        }
                    );
                }
            );
            break;
        case 'posts':
        case 'drafts':
        case 'trash':
            file_name = file.file_name;
            oldPath = path.join(HEXO_PATH[type.replace(/s$/, '') + 'Path'], file_name);

            if (type === 'trash' && target_type === 'trash') {
                fs.unlink(
                    oldPath,
                    function (err) {
                        if (err) {
                            res.status(500).send({"status": "error", "msg": "删除文件失败！"})
                        }

                        getAllData.updateDBFile();
                        res.json({"status": "success"});
                    }
                )
            }
            else {
                if (target_type === 'page') {
                    newPath = path.join(HEXO_PATH.sourcePath, file_name.replace(/\.md$/, ''));

                    fs.access(
                        newPath,
                        fs.F_OK,
                        function (err) {
                            if (!err) {
                                res.status(500).send({"status": "error", "msg": target_type + "中已有相同的路径！"});
                                return;
                            }

                            fs.mkdir(
                                newPath,
                                function (err) {
                                    if (err) {
                                        throw err;
                                    }

                                    moveFile(oldPath, path.join(newPath, 'index.md'));
                                }
                            )
                        }
                    );
                }
                else {
                    newPath = path.join(HEXO_PATH[target_type + 'Path'], file_name);

                    fs.access(
                        newPath,
                        fs.F_OK,
                        function (err) {
                            if (!err) {
                                res.status(500).send({"status": "error", "msg": target_type + "中存在同名文件！"});
                                return;
                            }

                            moveFile(oldPath, newPath);
                        }
                    );
                }
            }
            break;
        default:
            res.status(500).send({"status": "error", "msg": "不支持改操作！"})
    }

    function moveFile(oldPath, newPath, fn) {
        fs.rename(
            oldPath,
            newPath,
            function (err) {
                if (err) {
                    res.status(500).send({"status": "error", "msg": "移动文件失败！"});
                    throw err;
                }

                if (fn && typeof fn === 'function') fn();

                getAllData.updateDBFile();
                res.json({"status": "success"});
            }
        );
    }
};

function deleteDBCache() {
    delete require.cache[path.join(HEXO_PATH.adminPath, '__siteDB.json')];
}
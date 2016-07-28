const HEXO_PATH = require('../module/config-init').data(),
    PATH = require('path'),
    FS = require('fs'),
    GET_ALL_DATA = require('../module/get-all-data');

exports.entry = function (req, res) {
    deleteDBCache();
    res.render('index.ejs', {data: require('../__siteDB.json')});
};

exports.getAll = function (req, res) {
    deleteDBCache();
    res.json({status: "success", data: require('../__siteDB.json')});
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

    if (query.type == 'site') {
        res.json(DB.siteConfig);
    }
    else if (query.type = 'theme') {
        res.json(DB.themeConfig);
    }
    else {
        res.status(500).send({"msg": "类型不正确！", "param": query});
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
                file_path = PATH.join(HEXO_PATH.sourcePath, file_in_DB.page_url, file_name) :
                file_path = PATH.join(HEXO_PATH.sourcePath, '_' + file_type, file_name);

            writeFile(file_path);
        }
        else {
            file_name = body.file_name;

            if (file_type === 'pages') {
                file_path = PATH.join(HEXO_PATH.sourcePath, file_name);

                FS.access(file_path, FS.F_OK, function (err) {
                    if (err) {
                        try {
                            FS.mkdirSync(file_path);
                            file_path = PATH.join(file_path, 'index.md');
                            writeFile(file_path);
                        }
                        catch (e) {
                            throw 'create PATH failed:' + file_path;
                        }
                    }
                    else {
                        res.status(500).send({status: 'error', msg: '路径:' + file_name + ' 已存在'});
                    }
                });
            }

            else if (file_type === 'posts' || file_type === 'drafts') {
                file_path = PATH.join(HEXO_PATH[file_type.replace(/s$/, '') + 'Path'], file_name + '.md');

                FS.access(file_path, FS.F_OK, function (err) {
                    if (err) {
                        writeFile(file_path);
                    }
                    else {
                        res.status(500).send({status: 'error', msg: '文件:' + file_name + '.md 已存在'});
                    }
                });
            }

            else {
                res.status(500).send({status: 'error', msg: '文章类型不正确！'});
            }
        }

        function writeFile(filePath) {
            FS.writeFile(filePath, file_content, 'utf-8', function (err) {
                if (err) res.status(500).send({status: 'error', msg: 'file write err!'});

                GET_ALL_DATA.updateDBFile();
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
        DB = require('../__siteDB.json');

    try {
        var file = DB[type][index];
    }
    catch (e) {
        res.status(500).send({"status": "error", "msg": "DB中没有找到该文章！"});
        throw e;
    }

    var file_name, oldPath, newPath;

    switch (type) {
        case 'pages':
            file_name = file.page_url + '.md';
            oldPath = PATH.join(HEXO_PATH.sourcePath, file.page_url, 'index.md');
            newPath = PATH.join(HEXO_PATH[target_type + 'Path'], file_name);

            FS.access(
                newPath,
                FS.F_OK,
                function (err) {
                    if (err) {
                        moveFile(
                            oldPath,
                            newPath,

                            // 移动完成后，需要删除原来的空文件夹
                            function () {
                                FS.rmdir(
                                    PATH.join(HEXO_PATH.sourcePath, file.page_url),
                                    function (err) {
                                        if (err) throw err;
                                    }
                                );
                            }
                        );
                    }
                    else {
                        res.status(500).send({"status": "error", "msg": target_type + "中存在同名文件！"});
                    }
                }
            );
            break;
        case 'posts':
        case 'drafts':
        case 'trash':
            file_name = file.file_name;
            oldPath = PATH.join(HEXO_PATH[type.replace(/s$/, '') + 'Path'], file_name);

            if (type === 'trash' && target_type === 'trash') {
                FS.unlink(
                    oldPath,
                    function (err) {
                        if (err) {
                            res.status(500).send({"status": "error", "msg": "删除文件失败！"});
                            throw err;
                        }

                        GET_ALL_DATA.updateDBFile();
                        res.json({"status": "success", "msg": "删除成功！"});
                    }
                )
            }
            else {
                if (target_type === 'page') {
                    newPath = PATH.join(HEXO_PATH.sourcePath, file_name.replace(/\.md$/, ''));

                    FS.access(
                        newPath,
                        FS.F_OK,
                        function (err) {
                            if (err) {
                                FS.mkdir(
                                    newPath,
                                    function (err) {
                                        if (err) throw err;
                                        moveFile(oldPath, PATH.join(newPath, 'index.md'));
                                    }
                                )
                            }
                            else {
                                res.status(500).send({"status": "error", "msg": target_type + "中已有相同的路径！"});
                            }
                        }
                    );
                }
                else {
                    newPath = PATH.join(HEXO_PATH[target_type + 'Path'], file_name);

                    FS.access(
                        newPath,
                        FS.F_OK,
                        function (err) {
                            if (err) {
                                moveFile(oldPath, newPath);
                            }
                            else {
                                res.status(500).send({"status": "error", "msg": target_type + "中存在同名文件！"});
                            }
                        }
                    );
                }
            }
            break;
        default:
            res.status(500).send({"status": "error", "msg": "不支持改操作！"})
    }

    function moveFile(oldPath, newPath, fn) {
        FS.rename(
            oldPath,
            newPath,
            function (err) {
                if (err) {
                    res.status(500).send({"status": "error", "msg": "移动文件失败！"});
                    throw err;
                }

                if (fn && typeof fn === 'function') fn();

                GET_ALL_DATA.updateDBFile();
                res.json({"status": "success"});
            }
        );
    }
};

function deleteDBCache() {
    delete require.cache[PATH.join(HEXO_PATH.adminPath, '__siteDB.json')];
}
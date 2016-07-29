const HEXO_PATH = require('../module/config-init').data(),
    PATH = require('path'),
    FS = require('fs'),
    LOGGER = require('log4js').getLogger(),
    GET_ALL_DATA = require('../module/get-all-data');

exports.entry = function (req, res) {
    deleteDBCache();
    res.render('index.ejs', {data: require('../__siteDB.json')});
};

exports.getAll = function (req, res) {
    deleteDBCache();
    LOGGER.info('get db content');
    res.json({status: "success", data: require('../__siteDB.json')});
};

exports.getMarkdownFile = function (req, res) {
    deleteDBCache();
    var query = req.query,
        DB = require('../__siteDB.json');

    if (query.type && !Number.isNaN(Number(query.index))) {
        if (DB[query.type][query.index]) {
            LOGGER.info('getting:' + DB[query.type][query.index].file_path);
            res.json(DB[query.type][query.index]);
        }
        else {
            LOGGER.error("Didn't find post!");
            res.status(500).send({"type": "error", "msg": "Didn't find post!", "param": query});
        }
    }
    else {
        LOGGER.error('get markdown file param error! param:' + JSON.stringify(query));
        res.status(500).send({"type": "error", "msg": "Param error！", "param": query});
    }
};

exports.getConfig = function (req, res) {
    deleteDBCache();
    var query = req.query,
        DB = require('../__siteDB.json');

    if (query.type == 'site') {
        LOGGER.info('getting:' + DB.siteConfig.file_path);
        res.json(DB.siteConfig);
    }
    else if (query.type = 'theme') {
        LOGGER.info('getting:' + DB.themeConfig.file_path);
        res.json(DB.themeConfig);
    }
    else {
        LOGGER.warn('wrong config type:' + JSON.stringify(query));
        res.status(500).send({"msg": "wrong type", "param": query});
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
                        LOGGER.warn('page path is already exist:source/' + file_name);
                        res.status(500).send({status: 'error', msg: 'page path is already exist:source/' + file_name});
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
                        LOGGER.warn('file is already exist:' + file_name);
                        res.status(500).send({status: 'error', msg: 'file is already exist:' + file_name + '.md'});
                    }
                });
            }

            else {
                LOGGER.error('wrong post type');
                res.status(500).send({status: 'error', msg: 'Wrong type!'});
            }
        }

        function writeFile(filePath) {
            FS.writeFile(filePath, file_content, 'utf-8', function (err) {
                if (err) {
                    LOGGER.error('write file:' + filePath + ' error! error:' + JSON.stringify(err));
                    res.status(500).send({status: 'error', msg: 'file write err!'});
                }

                LOGGER.info('write file:' + filePath + ' succeed');
                GET_ALL_DATA.updateDBFile();
                res.json({status: 'success'});
            });
        }
    }
    else {
        LOGGER.error('didn\'t receive param');
        res.status(500).send({status: 'error', msg: 'Didn\'t receive param'});
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
        LOGGER.error('didn\'t find post!');
        res.status(500).send({"status": "error", "msg": "Didn't find post!"});
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
                                        if (err) {
                                            LOGGER.warn('can\'t rmdir:' + PATH.join(HEXO_PATH.sourcePath, file.page_url));
                                            throw err;
                                        }
                                        LOGGER.info('rmdir:' + PATH.join(HEXO_PATH.sourcePath, file.page_url));
                                    }
                                );
                            }
                        );
                    }
                    else {
                        LOGGER.error(newPath + " already exist!");
                        res.status(500).send({"status": "error", "msg": newPath + " already exist!"});
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
                            LOGGER.error('failed to delete file:' + oldPath);
                            res.status(500).send({"status": "error", "msg": "failed to delete file:" + oldPath});
                            throw err;
                        }

                        LOGGER.info('delete:' + oldPath + ' succeed');
                        GET_ALL_DATA.updateDBFile();
                        res.json({"status": "success", "msg": "delete:" + oldPath + " succeed"});
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
                                LOGGER.error(newPath + " already exist!");
                                res.status(500).send({"status": "error", "msg": newPath + " already exist!"});
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
                                LOGGER.error(newPath + " already exist!");
                                res.status(500).send({"status": "error", "msg": newPath + " already exist!"});
                            }
                        }
                    );
                }
            }
            break;
        default:
            LOGGER.error("option doesn't support!param:" + JSON.stringify(body));
            res.status(500).send({"status": "error", "msg": "option doesn't support!param:" + JSON.stringify(body)});
    }

    function moveFile(oldPath, newPath, fn) {
        FS.rename(
            oldPath,
            newPath,
            function (err) {
                if (err) {
                    LOGGER.error('Failed to move file:' + oldPath + ' to ' + newPath);
                    res.status(500).send({"status": "error", "msg": "Move file failed"});
                    throw err;
                }

                if (fn && typeof fn === 'function') fn();

                LOGGER.info('Move file:' + oldPath + ' to ' + newPath);
                GET_ALL_DATA.updateDBFile();
                res.json({"status": "success"});
            }
        );
    }
};

function deleteDBCache() {
    delete require.cache[PATH.join(HEXO_PATH.adminPath, '__siteDB.json')];
}
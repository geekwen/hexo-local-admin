const CHILD_PROCESS = require('child_process'),
    bf = require('buffer'),
    HEXO_PATH = require('../config');

var hexo_server = null;

exports.server = function (req, res) {
    try {
        if (hexo_server !== null) {
            hexo_server.kill();
            hexo_server = null;
        }

        // 启动时先 clean 一下
        var clean = CHILD_PROCESS.spawn(
            'hexo',
            ['clean'],
            {cwd: HEXO_PATH.rootPath}
        );

        clean.stdout.on('data', function (data) {
            console.log(data.toString('utf8'));
        });

        clean.on('exit', function () {
            console.log('hexo cleaned!');

            hexo_server = CHILD_PROCESS.spawn(
                'hexo',
                ['server'],
                {cwd: HEXO_PATH.rootPath}
            );

            hexo_server.stdout.on('data', function (data) {
                console.log(data.toString('utf8'));
            });

            hexo_server.on('exit', function () {
                console.log('hexo stopped!');
                hexo_server = null;
            });
            res.json({"status": "success"});
        });
    }
    catch (e) {
        res.status(500).send({"status": "error", "msg": "hexo server launch failed！"});
    }
};

exports.kill = function (req, res) {
    try {
        hexo_server.kill();
        hexo_server = null;
        res.json({"status": "success"});
    }
    catch
        (e) {
        res.status(500).send(e);
    }
};

exports.deploy = function (req, res) {
    try {
        var hexo_deploy = CHILD_PROCESS.spawn(
            'hexo',
            ['deploy', '-g'],
            {cwd: HEXO_PATH.rootPath}
        );

        hexo_deploy.stdout.on('data', function (data) {
            console.log(data.toString('utf8'));
        });

        hexo_deploy.on('exit', function () {
            console.log('hexo deployed!');
            res.json({"status": "success"});
        });
    }
    catch (e) {
        res.status(500).send({"status": "error", "msg": "hexo deploy failed！"});
    }
};
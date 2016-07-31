const CHILD_PROCESS = require('child_process'),
    LOGGER = require('log4js').getLogger(),
    HEXO_PATH = require('../module/config-init').data();

var hexo_server = null,
    isWin = /^win/.test(process.platform),
    hexo_cli = isWin ? 'hexo.cmd' : 'hexo';

exports.server = function (req, res) {
    try {
        if (hexo_server !== null) {
            hexo_server.kill('SIGHUP');
            hexo_server = null;
        }

        // 启动时先 clean 一下
        var clean = CHILD_PROCESS.spawn(
            hexo_cli,
            ['clean'],
            {cwd: HEXO_PATH.rootPath}
        );

        clean.stdout.on('data', function (data) {
            LOGGER.info(data.toString('utf8'));
        });

        clean.on('exit', function () {
            LOGGER.info('hexo cleaned!');

            hexo_server = CHILD_PROCESS.spawn(
                hexo_cli,
                ['server'],
                {cwd: HEXO_PATH.rootPath}
            );

            hexo_server.stdout.on('data', function (data) {
                LOGGER.info(data.toString('utf8'));
            });

            hexo_server.on('exit', function () {
                LOGGER.info('hexo stopped!');
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
        hexo_server.kill('SIGHUP');
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
            hexo_cli,
            ['deploy', '-g'],
            {cwd: HEXO_PATH.rootPath}
        );

        hexo_deploy.stdout.on('data', function (data) {
            LOGGER.info(data.toString('utf8'));
        });

        hexo_deploy.on('exit', function () {
            LOGGER.info('hexo deployed!');
            res.json({"status": "success"});
        });
    }
    catch (e) {
        res.status(500).send({"status": "error", "msg": "hexo deploy failed！"});
    }
};
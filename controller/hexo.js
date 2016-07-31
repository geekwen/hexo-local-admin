const CHILD_PROCESS = require('child_process'),
    LOGGER = require('log4js').getLogger(),
    HEXO_PATH = require('../module/config-init').data(),
    TREE_KILL = require('tree-kill');

var hexo_server = null,
    isWin = /^win/.test(process.platform),
    hexo_pid = NaN;
hexo_cli = isWin ? 'hexo.cmd' : 'hexo';

exports.server = function (req, res) {
    try {
        if (!Number.isNaN(hexo_pid)) killHexo();

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

            hexo_pid = hexo_server.pid;
            LOGGER.info('hexo pid:' + hexo_pid);

            hexo_server.stdout.on('data', function (data) {
                LOGGER.info(data.toString('utf8'));
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
        killHexo();
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

function killHexo() {
    if (isWin) {
        TREE_KILL(hexo_pid, 'SIGTERM', function (err) {
            if (err) {
                LOGGER.error('kill hexo failed. hexo pid:' + hexo_pid + ';error=' + JSON.stringify(err));
                return;
            }
            LOGGER.info('hexo stopped');
            hexo_pid = NaN;
        });
    }
    else {
        hexo_server.kill();
        hexo_pid = NaN;
        LOGGER.info('hexo stopped');
    }
}
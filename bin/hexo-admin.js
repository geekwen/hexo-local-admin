#!/usr/bin/env node

const PROGRAM = require('commander'),
    FS = require('fs'),
    PATH = require('path'),
    CHILD_PROCESS = require('child_process'),
    LOGGER = require('log4js').getLogger(),
    CONFIG_INIT = require('../module/config-init'),
    OS = require('os');

var config = CONFIG_INIT.data(),
    data;

PROGRAM.version(require('../package.json').version);

PROGRAM.command('start')
    .description('Start hexo local admin server')
    .action(start);

PROGRAM
    .option('-r, --root-path [root_path]', 'view/set hexo root path')
    .option('-t, --theme-name [theme_name]', 'view/set hexo theme name');

PROGRAM.parse(process.argv);

function start() {
    var isPathReady = CONFIG_INIT.isPathReady();
    if (!isPathReady.status) {
        console.log(isPathReady.msg);
        process.exit(1);
    }
    else {
        LOGGER.info('ready to start');
        var app = CHILD_PROCESS.fork(
            'app.js',
            [],
            {cwd: PATH.join(__dirname, '..')}
        );

        LOGGER.info("pid:" + app.pid);

        app.on('error', function (e) {
            console.log(e);
        });
    }
}

if (typeof PROGRAM.rootPath === 'string' && typeof PROGRAM.themeName === 'string') {
    data = {
        rootPath: PROGRAM.rootPath,
        theme: PROGRAM.themeName
    };

    try {
        FS.writeFileSync(config.configPath, JSON.stringify(data), 'utf-8');
        console.log('Hexo root path is set to:' + PROGRAM.rootPath);
        console.log('Hexo theme is set to:' + PROGRAM.themeName);
    }
    catch (error) {
        throw error;
    }
    process.exit(0);
}

if (PROGRAM.rootPath) {
    var rootPath = PROGRAM.rootPath;
    if (typeof rootPath === 'boolean') {
        config.rootPath === '.' ?
            console.log('Currently hexo root path is not set.') :
            console.log('Currently hexo root path is:' + config.rootPath);
    }
    else {
        data = {
            rootPath: rootPath,
            theme: config.theme
        };

        try {
            FS.writeFileSync(config.configPath, JSON.stringify(data), 'utf-8');
            console.log('Hexo root path is set to:' + rootPath);
        }
        catch (error) {
            throw error;
        }
    }
}

if (PROGRAM.themeName) {
    var themeName = PROGRAM.themeName;
    if (typeof themeName === 'boolean') {
        config.theme === '.' ?
            console.log('Currently hexo theme is not set.') :
            console.log('Currently hexo theme is:' + config.theme);
    }
    else {
        data = {
            rootPath: config.rootPath,
            theme: themeName
        };

        try {
            FS.writeFileSync(config.configPath, JSON.stringify(data), 'utf-8');
            console.log('Hexo theme is set to:' + themeName);
        }
        catch (error) {
            throw error;
        }
    }
}


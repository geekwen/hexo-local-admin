const FS = require('fs'),
    PATH = require('path'),
    OS = require('os'),
    LOGGER = require('log4js').getLogger();

var configPath;

/^win/.test(OS.platform()) ?
    configPath = PATH.join(OS.homedir(), 'Documents', '.hexo-local-admin-config.json') :
    configPath = PATH.join(OS.homedir(), '.hexo-local-admin-config.json');

try {
    config = require(configPath);
}
catch (e) {
    try {
        config = {
            rootPath: '.',
            theme: '.'
        };
        FS.writeFileSync(configPath, JSON.stringify(config), 'utf-8');
    }
    catch (e) {
        throw e;
    }
}

isPathReady();

function isPathReady() {
    if (config.rootPath === '.') {
        let msg = '\n--------\nERROR!!!\nhexo root path is not set!\ntry "hexo-admin -r your-hexo-path" to set hexo root path\n--------';
        LOGGER.warn(msg);
        return {
            status: false,
            msg: msg
        };
    }

    if (config.theme === '.') {
        let msg = '\n--------\nERROR!!!\nhexo theme name is not set!\ntry "hexo-admin -t your-theme-name" to set hexo theme\n--------';
        LOGGER.warn(msg);
        return {
            status: false,
            msg: msg
        };
    }

    try {
        FS.accessSync(config.rootPath, FS.F_OK);
        FS.accessSync(PATH.join(config.rootPath, 'themes', config.theme), FS.F_OK);
        return {
            status: true,
            msg: 'config is set!'
        };
    }
    catch (error) {
        throw error;
    }
}

function data() {
    config.configPath = configPath;
    config.adminPath = PATH.join(__dirname, '..');
    config.siteConfig = PATH.join(config.rootPath, '_config.yml');
    config.themeConfig = PATH.join(config.rootPath, 'themes', config.theme, '_config.yml');
    config.sourcePath = PATH.join(config.rootPath, 'source');
    config.postPath = PATH.join(config.sourcePath, '_posts');
    config.draftPath = PATH.join(config.sourcePath, '_drafts');
    config.trashPath = PATH.join(config.sourcePath, '_trash');
    return config;
}

exports.isPathReady = isPathReady;
exports.data = data;

const FS = require('fs'),
    PATH = require('path'),
    OS = require('os');

var configPath = PATH.join(OS.homedir(), '.hexo-local-admin-config.json');

try {
    config = require(configPath);
}
catch (e) {
    try {
        FS.writeFileSync(configPath, {"rootPath": ".", "theme": "."}, 'utf-8');
        config = {
            rootPath: '.',
            theme: '.'
        }
    }
    catch (e) {
        throw e;
    }
}

exports.isPathReady = function () {
    if (config.rootPath === '.') {
        return {
            status: false,
            msg: '--------\nERROR!!!\nhexo root path is not set!\ntry "hexo-admin -r your-hexo-path" to set hexo root path\n--------'
        }
    }

    if (config.theme === '.') {
        return {
            status: false,
            msg: '--------\nERROR!!!\nhexo theme name is not set!\ntry "hexo-admin -t your-theme-name" to set hexo theme\n--------'
        }
    }

    try {
        FS.accessSync(config.rootPath, FS.F_OK);
        FS.accessSync(PATH.join(config.rootPath, 'themes', config.theme), FS.F_OK);
        return {
            status: true,
            msg: 'config is set!'
        }
    }
    catch (error) {
        throw error;
    }
};

exports.data = function () {
    config.adminPath = PATH.join(__dirname, '..');
    config.siteConfig = PATH.join(config.rootPath, '_config.yml');
    config.themeConfig = PATH.join(config.rootPath, 'themes', config.theme, '_config.yml');
    config.sourcePath = PATH.join(config.rootPath, 'source');
    config.postPath = PATH.join(config.sourcePath, '_posts');
    config.draftPath = PATH.join(config.sourcePath, '_drafts');
    config.trashPath = PATH.join(config.sourcePath, '_trash');
    return config;
};
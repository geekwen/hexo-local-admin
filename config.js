// todo 先得检查hexo root path 和 theme 有没有设置

module.exports = (function () {
    var path = require('path'),
        config = {};

    // hexo dir path
    config.rootPath = "/Users/Geekwen/Sites/test/hexo";

    // theme dir name
    config.theme = "landscape";

    // do not edit anything below
    config.adminPath = __dirname;
    config.siteConfig = path.join(config.rootPath, '_config.yml');
    config.themeConfig = path.join(config.rootPath, 'themes', config.theme, '_config.yml');
    config.sourcePath = path.join(config.rootPath, 'source');
    config.postPath = path.join(config.sourcePath, '_posts');
    config.draftPath = path.join(config.sourcePath, '_drafts');
    config.trashPath = path.join(config.sourcePath, '_trash');

    return config;
}());
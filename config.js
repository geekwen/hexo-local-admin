module.exports = (function () {
    var path = require('path'),
        config = {};

    // hexo dir path
    config.rootPath = "your_hexo_path";

    // theme dir name
    config.theme = "your_theme_dir_name";

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
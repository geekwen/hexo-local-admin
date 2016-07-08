// todo 先得检查hexo root path 和 theme 有没有设置

module.exports = (function () {
    var config = {};

    config.rootPath = "";
    config.theme = "";

    config.adminPath = __dirname;
    config.siteConfig = config.rootPath + '/_config.yml';
    config.themeConfig = config.rootPath + '/themes/' + config.theme + '/_config.yml';
    config.sourcePath = config.rootPath + '/source';
    config.postPath = config.sourcePath + '/_posts';
    config.draftPath = config.sourcePath + '/_drafts';
    config.trashPath = config.sourcePath + '/_trash';

    return config;
}());
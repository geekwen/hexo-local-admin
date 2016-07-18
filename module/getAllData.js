/**
 * 获取source文件夹下的文件，分析整个站点的数据内容
 * @module getAllData
 */

const HEXO_PATH = require('../config');

var fs = require('fs'),
    path = require('path'),
    extend = require('extend');

exports.updateDBFile = function () {
    var flagIndex = 0;

    // 初始化 _posts, _drafts, _trash文件夹
    ['post', 'draft', 'trash'].forEach(function (item) {
        fs.access(
            HEXO_PATH[item + 'Path'],
            fs.F_OK,
            function (err) {
                if (err) {
                    fs.mkdir(
                        HEXO_PATH[item + 'Path'],
                        function (e) {
                            if (e) throw e;
                            flagIndex++;
                            if (flagIndex === 3) action();
                        }
                    );
                    return;
                }
                flagIndex++;
                if (flagIndex === 3) action();
            }
        );
    });

    function action() {
        var siteData = {
            hexoPath: HEXO_PATH.rootPath,
            theme: HEXO_PATH.theme,
            posts: getDirMdFiles(HEXO_PATH.postPath),
            drafts: getDirMdFiles(HEXO_PATH.draftPath),
            trash: getDirMdFiles(HEXO_PATH.trashPath),
            pages: getPages(),
            themeConfig: getFile(HEXO_PATH.themeConfig),
            siteConfig: getFile(HEXO_PATH.siteConfig)
        };

        siteData.tags = getTagData(siteData.posts);

        fs.writeFile(
            path.join(HEXO_PATH.adminPath, '__siteDB.json'),
            JSON.stringify(siteData),
            function (err) {
                if (err) throw err;
                console.log('__siteDB.json update!');
            }
        );
    }
};

/**
 * 读取某个目录下的markdown文件
 * @param {string} dirPath - 文件路径
 * @returns {object[]} array of file content
 * */
function getDirMdFiles(dirPath) {
    console.log('getting content of:' + dirPath);
    var data = [];

    try {
        fs.readdirSync(dirPath).forEach(function (file_name) {
            // 过滤掉非md结尾的文件
            if (file_name.search(/\.md$/) === -1) return;
            data.push(getPostFileContent(dirPath, file_name));
        });
    }
    catch (err) {
        throw err;
    }

    // 最新的排最前面
    return data.sort(sortListFromNewToOld);
}

/**
 * 获取所有的页面，注意：仅支持source/page-path/index.md这种单一的方式
 * @returns {object[]} array of page content
 * */
function getPages() {
    var data = [],
        sourcePath = HEXO_PATH.sourcePath,
        itemNames;

    try {
        itemNames = fs.readdirSync(sourcePath);
    }
    catch (err) {
        throw err;
    }

    itemNames.forEach(function (itemName) {
        try {
            if (fs.lstatSync(path.join(sourcePath, itemName)).isDirectory() && itemName.search(/^_/) === -1) {
                data.push(extend(getPostFileContent(path.join(sourcePath, itemName), 'index.md'), {page_url: itemName}));
            }
        }
        catch (e) {
            console.error(e);
        }
    });

    return data.sort(sortListFromNewToOld);
}

/**
 * 读取文件内容
 * @param {string} filePath 文件路径
 * @returns {string} fileContent
 * */
function getFile(filePath) {
    var fileContent;

    try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
    }
    catch (e) {
        throw e;
    }

    return fileContent;
}

/**
 * 读取文章文件，并对内容进行分析、整理
 * @param   {string}  dirPath                 完整的文件路径（绝对路径）
 * @param   {string}  fileName                完整的文件名（包括后缀）
 * @return  {object}  文件对象
 * */
function getPostFileContent(dirPath, fileName) {
    if (fileName.search(/\.md$/) === -1) return null;
    var file = {
        file_name: fileName,
        file_path: path.join(dirPath, fileName)
    };

    try {
        file.raw_content = fs.readFileSync(file.file_path, 'utf-8');
    }
    catch (e) {
        throw e;
    }

    var front_matter = file.raw_content.split('---');

    // 解析Front-matter信息，注意：Front-matter每一项内容需要在一行
    front_matter[0] ?
        front_matter = front_matter[0] :
        front_matter = front_matter[1];

    // todo 优化front matter的解析
    front_matter.split(/\n/).forEach(function (item) {
        if (!item) return;
        var attr = item.match(/^.*?(?=:)/)[0],
            value = item.replace(attr + ':', '').trim();
        if (value.search(/^\[/) !== -1 && value.search(/]$/) !== -1) value = value.replace(/\[|]|\s/g, '').split(',');
        file[attr] = value;
    });

    // todo 如果没有时间，则设置文件创建时间
    file.date_unix = Date.parse(file.date);

    return file;
}

/**
 * 从文件数组中统计tags
 * @param {object[]} fileArr 文件数组
 * @returns {object} tag统计对象
 * */
function getTagData(fileArr) {
    var tagData = {length: 0};

    fileArr.forEach(function (item) {
        if (!item.hasOwnProperty('tags') || !item.tags) return;
        Array.isArray(item.tags) ?
            item.tags.forEach(addNewTag) :
            addNewTag(item.tags);
    });

    function addNewTag(tagName) {
        if (tagData.hasOwnProperty(tagName)) {
            tagData[tagName].length++;
        }
        else {
            tagData[tagName] = {length: 1};
            tagData.length++;
        }
    }

    return tagData;
}

/** 对文件数组进行排序 */
function sortListFromNewToOld(file1, file2) {
    if (file1.date_unix > file2.date_unix) {
        return -1;
    }
    else if (file1.date_unix < file2.date_unix) {
        return 1;
    }
    else {
        return 0;
    }
}
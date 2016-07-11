/**
 * webpack 进行打包构建
 * 在控制台执行:
 *
 * 'webpack'                            即可打包
 * 'webpack --watch'                    监听文件状态
 * 'webpack --display-error-details'    显示错误信息
 * 'webpack --progress'                 显示执行进度
 *
 * for more: http://webpack.github.io/docs/cli.htm
 * */

// var webpack = require('webpack');
module.exports = {
    entry: {'./views/public/js/entry': './views/js/entry.js'},
    output: {
        path: './',
        filename: '[name].min.js'
    },
    module: {
        loaders: [
            {test: /\.ejs$/, loader: 'ejs-compiled'}
        ]
    }
};
const PORT = 4001,
    EXPRESS = require('express'),
    BODY_PARSER = require('body-parser'),
    FS = require('fs'),
    PATH = require('path'),
    LOGGER = require('log4js').getLogger(),
    APP = EXPRESS();

APP.set('view engine', 'ejs');
APP.set('views', PATH.join(__dirname, 'views/ejs'));
APP.use(EXPRESS.static('views/public'));
APP.use(BODY_PARSER.urlencoded({extended: true}));
APP.use(BODY_PARSER.json());

require('./route/route.json').forEach(function (route) {
    APP[route.method](route.path, require(PATH.join(__dirname, 'controller', route.module))[route.handler])
});

APP.listen(PORT, function () {
    LOGGER.info('Hexo local admin is working! Please visit http://localhost:' + PORT);
    LOGGER.info('press CTL + C to stop');
});

// 启动服务时默认跑一边数据
require('./module/get-all-data').updateDBFile();

process.on('SIGINT', function() {
    console.log('\nBye, hope to see you again.');
    process.exit(0);
});

const PORT = 4001;

var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    body_parser = require('body-parser'),
    app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views/ejs'));
app.use(express.static('views/public'));
app.use(body_parser());

require('./route/route.json').forEach(function (route) {
    app[route.method](route.path, require(path.join(__dirname, 'controller', route.module))[route.handler])
});

app.listen(PORT, function () {
    console.log('Hexo local admin app listening on port ' + PORT);
});

// 启动服务时默认跑一边数据 
require('./module/getAllData').updateDBFile();

exports.entry = function (res, req) {
    req.render('index.ejs', {data: require('../__siteDB.json')});
};


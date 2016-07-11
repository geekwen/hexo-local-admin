// todo 消息通知系统

// 事件委托
$.fn.multiOn = function (obj) {
    for (var eName in obj)
        if (obj.hasOwnProperty(eName))
            for (var selector in obj[eName])
                if (obj[eName].hasOwnProperty(selector))
                    $(this).on(eName, selector, obj[eName][selector]);
};

var $listNav = $('#list-nav'),
    $listNavLi = $listNav.children('li');

$listNavLi.click(function () {
    $listNavLi.removeClass('active');
    $(this).addClass('active');
    $listNav.attr('data-select', $(this).attr('data-index'));
});


var $content_wrap = $('#content-detail-wrap');

$('.f-item').click(function () {
    var $this = $(this),
        $content_body = $('#content-detail-body');

    $.ajax({
        url: '/get-markdown-file',
        method: 'get',
        timeout: 1000,
        data: {
            type: $this.attr('data-type'),
            index: $this.attr('data-index')
        },
        dataType: 'json',
        cache: false,
        success: function (data) {
            if (!data.status) {
                $content_body.empty().html(require('../ejs/tpl/file-content.ejs')({data: data}));
                $content_wrap.addClass('show');
                $('html, body').addClass('no-scroll');
            }
            else {
                console.log('success, data=%O', data);
            }
        },
        error: function (err) {
            console.log('error, err=%O', err);
        }
    });
});

$('#close-detail').click(function () {
    $content_wrap.removeClass('show');
    $('html, body').removeClass('no-scroll');
});

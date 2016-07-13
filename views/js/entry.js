// todo 消息通知系统
const AJAX_TIMEOUT = 1000;

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

$('.f-item').click(function () {
    // todo add filename
    var $this = $(this),
        type = $this.attr('data-type'),
        index = $this.attr('data-index');

    $.ajax({
        url: '/get-markdown-file',
        method: 'get',
        timeout: AJAX_TIMEOUT,
        data: {
            type: type,
            index: index
        },
        dataType: 'json',
        cache: false,
        success: function (data) {
            showContentDetail($.extend(data, {type: type, index: index}))
        },
        error: function (err) {
            console.log('error, err=%O', err.responseJSON);
        }
    });
});

$('.view-config').click(function () {
    var type = $(this).attr('data-type');

    if (type.search(/site|theme/) === -1) {
        console.warn('no such config type:' + type);
        return;
    }

    $('#content-detail-head').html('<h3>' + type.toUpperCase() + ' CONFIG</h3><hr>');

    $.ajax({
        url: '/get-config',
        method: 'get',
        timeout: AJAX_TIMEOUT,
        data: {type: type},
        dataType: 'json',
        cache: false,
        success: showContentDetail,
        error: function (err) {
            console.log('error, err=%O', err.responseJSON);
        }
    });
});

$('#close-detail').click(function () {
    $('#content-detail-inner').removeAttr('data-type');
    $('#content-detail-wrap').removeClass('show');
    $('html, body').removeClass('no-scroll');
    setTimeout(function () {
        $('#content-detail-inner').children('div').empty();
    }, 400);
});

$('body').mousedown(function (e) {
    var $target = $('#content-detail-inner');
    if ($('#content-detail-wrap').hasClass('show') && !$target.is(e.target) && $target.has(e.target).length === 0) {
        $('#close-detail').trigger('click');
    }
});

$('#alert').click(function () {
    $(this).removeClass('show');
});

// ------- detail actions ---------
$('#content-detail-body').multiOn({
    click: {
        '#t-edit': function () {
            var $this = $(this),
                $tools = $this.parent().children('li');

            // 操作按钮
            $tools.addClass('collapse');
            setTimeout(function () {
                $this.attr('id', 't-save').text('保存');
                $('<li id="t-cancel" class="collapse">取消</li>').insertAfter($this);

                $this.removeClass('collapse');
                setTimeout(function () {
                    $('#t-cancel').removeClass('collapse');
                }, 100);
            }, 400);

            // 缓存文章内容
            var $content = $('#content-detail'),
                content = $content.text();

            sessionStorage.setItem('content-cache', content);
            $content.empty().html('<textarea id="content-editor">' + content + '</textarea>');
        },
        '#t-cancel': function () {
            var $content = $('#content-detail'),
                $this = $(this),
                $tools = $this.parent().children('li'),
                prevContent = sessionStorage.getItem('content-cache');

            $content.html(prevContent);

            $tools.addClass('collapse');

            setTimeout(function () {
                $('#t-save').attr('id', 't-edit').text('编辑');
                $this.remove();
                $tools.removeAttr('class');
            }, 400);
        },
        '#t-save': function () {
            var $this = $(this),
                $editor = $('#content-editor'),
                $tools = $('#content-tool'),
                $content_detail = $('#content-detail'),
                type = $tools.attr('data-type'),
                index = $tools.attr('data-index');

            if ($this.hasClass('processing')) return;

            $this.addClass('processing');
            $.ajax({
                url: '/write-markdown-file',
                method: 'post',
                timeout: AJAX_TIMEOUT,
                data: {
                    'type': type,
                    'index': index,
                    'content': $editor.val()
                },
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.status && data.status == 'success') {
                        $tools.children('li').addClass('collapse');
                        $content_detail.html($editor.val().trim());

                        setTimeout(function () {
                            $this.attr('id', 't-edit').text('编辑');
                            $('#t-cancel').remove();
                            $tools.children('li').removeAttr('class');
                            bsAlert('success', '保存成功！');
                        }, 400);
                    }
                    else {
                        $this.removeClass('processing');
                        bsAlert('warning', '发现未知问题！');
                    }
                },
                error: function (err) {
                    $this.removeClass('processing');
                    bsAlert('danger', '错误：' + err.responseJSON);
                }
            });
        }
    }
});

function showContentDetail(data) {
    $('#content-detail-inner').attr('data-type', data.type);
    $('#content-detail-body').empty().html(require('../ejs/tpl/file-content.ejs')({data: data}));
    $('#content-detail-wrap').addClass('show');
    $('html, body').addClass('no-scroll');
}


var alertTime;
//default types: ['success', 'info', 'warning', 'danger']
/**
 * @param {string} type
 * @param {string} html
 * */
function bsAlert(type, html) {
    var $alert = $('#alert');

    if ($alert.hasClass('show')) {
        $alert.removeClass('show');
        setTimeout(action, 400);
    }
    else {
        action();
    }

    function action() {
        $alert.attr('class', $alert.attr('class').replace(/alert-\w* ?/g, ''));
        $alert.addClass('alert-' + type + ' show').html(html);
    }

    if (alertTime) clearTimeout(alertTime);
    alertTime = setTimeout(function () {
        $alert.removeClass('show');
    }, 3000);
}
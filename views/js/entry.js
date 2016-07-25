const AJAX_TIMEOUT = 1000;

// 事件委托
$.fn.multiOn = function (obj) {
    for (var eName in obj)
        if (obj.hasOwnProperty(eName))
            for (var selector in obj[eName])
                if (obj[eName].hasOwnProperty(selector))
                    $(this).on(eName, selector, obj[eName][selector]);
};

$('.view-config').click(function () {
    var type = $(this).attr('data-type');

    if (type.search(/site|theme/) === -1) {
        console.warn('no such config type:' + type);
        return;
    }

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
    $('#content-detail-inner').removeAttr('data-type class');
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

$('#main-container').multiOn({
    click: {
        '.f-item': function () {
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
                    console.log('error, err=%O', err.responseJSON.msg);
                }
            });
        },
        '#list-nav li': function () {
            $(this).parent().attr('data-select', $(this).attr('data-type'));
        }
    }
});

// ------- detail actions ---------
$('#content-detail-body').multiOn({
    click: {
        // 编辑、取消、保存
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
                            refreshList(type);
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
        },

        // 发布新文章/页面
        '#t-publish-new': function () {
            var $content_inner = $('#content-detail-inner'),
                $publishBtn = $('#t-publish-new'),
                file_name = $('#new-filename').val().trim(),
                type = $('[name="new-type"]:checked').val().trim(),
                content = $('#content-editor').val();

            $content_inner.addClass('processing');
            $publishBtn.attr('disabled', 'disabled');

            if (!file_name || !isFilePathNameValid(file_name)) {
                bsAlert('danger', '文件名/页面路径输入不正确');
                $publishBtn.removeAttr('disabled');
                $content_inner.removeClass('processing');
                return false;
            }

            $.ajax({
                url: '/write-markdown-file',
                method: 'post',
                timeout: AJAX_TIMEOUT,
                data: {
                    'type': type,
                    'file_name': file_name,
                    'content': content
                },
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (data.status && data.status == 'success') {
                        $('#close-detail').trigger('click');
                        bsAlert('success', '发布成功！');
                        refreshList(type);
                    }
                    else {
                        bsAlert('warning', '发现未知问题！');
                    }
                },
                error: function (err) {
                    bsAlert('danger', '错误：' + err.responseJSON.msg);
                    $content_inner.removeClass('processing');
                    $publishBtn.removeAttr('disabled');
                }
            });
        },

        // ---- 文件移动相关 ----
        // 移到草稿
        '#t-unpublish': function () {
            moveFileTo('drafts');
        },
        '#t-delete': function () {
            moveFileTo('trash');
        },
        '#t-publish-post': function () {
            moveFileTo('posts');
        },
        '#t-publish-page': function () {
            moveFileTo('pages');
        }
    }
});

$('#add-new').click(function () {
    showContentDetail({type: "new", tpl: require('../ejs/tpl/new-post.ejs')});
});

function showContentDetail(data) {
    var tpl = data.tpl || require('../ejs/tpl/file-content.ejs');
    $('#content-detail-inner').attr('data-type', data.type);
    $('#content-detail-body').empty().html(tpl({data: data}));
    $('#content-detail-wrap').addClass('show');
    $('html, body').addClass('no-scroll');
}

function moveFileTo(target_type) {
    var $tool_wrap = $('#content-tool'),
        type = $tool_wrap.attr('data-type'),
        index = $tool_wrap.attr('data-index');

    if (!type || !index) {
        bsAlert('danger', '参数不正确！');
        return;
    }

    $.ajax({
        url: '/move-markdown-file',
        method: 'post',
        timeout: AJAX_TIMEOUT,
        data: {
            'type': type,
            'index': index,
            'target_type': target_type
        },
        dataType: 'json',
        cache: false,
        success: function (data) {
            if (data.status && data.status == 'success') {
                $('#close-detail').trigger('click');
                bsAlert('success', data.msg || '移动成功');
                refreshList(target_type);
            }
            else {
                bsAlert('warning', 'moveFileTo 发现未知问题！');
            }
        },
        error: function (err) {
            bsAlert('danger', '错误：' + err.responseJSON.msg);
        }
    });
}

/**
 * @param {string} type one of ['posts', 'pages', 'drafts', 'trash']
 * */
function refreshList(type) {
    type = type || 'posts';
    $.ajax({
        url: '/get-all',
        method: 'get',
        timeout: AJAX_TIMEOUT,
        dataType: 'json',
        cache: false,
        success: function (data) {
            if (data.status && data.status == 'success') {
                data = data.data;

                $('#list-nav').parent().html(require('../ejs/tpl/list.ejs')({data: data, type: type}));

                var tagList = '',
                    $tagList = $('#tag-list');

                for (var tag in data.tags) {
                    if (data.tags.hasOwnProperty(tag) && tag !== 'length') {
                        tagList += '<li>' + tag + ' ( ' + data.tags[tag].length + ' )' + '</li>';
                    }
                }

                $tagList.find('h3').text('共有 ' + data.tags.length + ' 个标签');
                $tagList.find('ul').html(tagList);

                return;
            }

            bsAlert('warning', 'refreshList 发现未知问题！');
        },
        error: function (err) {
            bsAlert('danger', '错误：' + err.responseJSON);
        }
    });
}

var alertTime;
/**
 * @param {string} type  one of ['success', 'info', 'warning', 'danger']
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
        $alert.removeClass('alert-success alert-info alert-danger alert-warning');
        $alert.addClass('alert-' + type + ' show').html(html);
    }

    if (alertTime) clearTimeout(alertTime);
    alertTime = setTimeout(function () {
        $alert.removeClass('show');
    }, 3000);
}

function isFilePathNameValid(str) {
    return str.replace(/[a-zA-Z0-9]|_|-/g, '').length === 0;
}
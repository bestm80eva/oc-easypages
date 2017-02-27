//TODO CDMX: Document
$(document).ready(function () {

  $('.duplicable').hide();

  var base = $('.BuilderContent').data('base') + '/';

  function customAjax ( action, params, callback, callbackE ) {
    $.ajax({
      url: base + action,
      type: 'post',
      data: params,
      success: function ( response ) {
        if (typeof callback == 'function') {
          callback(response);
        }
      },
      error: function ( e ) {
        $.oc.flashMsg({
          'text': 'OsPages network error.',
          'class': 'warning',
          'interval': 3
        })
        if (typeof callbackE == 'function') {
          callbackE(e);
        }
      }
    })
  }

  $('.BuilderContent').on('click', '.submiter', function () {
    var btn = $(this);
    $(btn).attr('disabled', 'disabled');
    var wrapper = $(this).closest('.block');
    var indicator = $(wrapper).find('.loading-indicator-container');
    $(indicator).removeClass('hide');
    var params = {};
    params['title'] = $(wrapper).find('input[name="title"]').val();
    params['text'] = $(wrapper).find('textarea[name="text"]').val();
    params['el'] = $(this).data('el');
    customAjax('saveblock', params, function ( r ) {
      $(indicator).addClass('hide');
      $(btn).removeAttr('disabled');
      $.oc.flashMsg({
        'text': 'Bloque actualizado.',
        'class': 'success',
        'interval': 3
      })
      $('form').trigger('unchange.oc.changeMonitor');
      $('#ModalForm-block').modal('hide');
      $('#ModalForm-block').on('hidden.bs.modal', function () {
        window.location.reload();
      });
    }, function ( e ) {
      $('form').trigger('unchange.oc.changeMonitor');
      $(indicator).addClass('hide');
      $(btn).removeAttr('disabled');
      $.oc.flashMsg({
        'text': 'OsPages network error ' + e,
        'class': 'warning',
        'interval': 3
      })
      $('form').changeMonitor();
    });
  });

  $('.BuilderContent').on('click', '.deleter', function () {
    $("#Modal-confirm-delete").modal("show");
    $("#Modal-confirm-delete input[name=el]").val($(this).data("el"));
  });

  $('.deleteBtn').click(function(e) {
    e.preventDefault();
    $('#deleteitem').ajaxSubmit({
      success: function (r) {
        $('#ModalForm-confirm-delete').modal('hide');
        setTimeout(function () {
          location.reload();
        }, 300);
      }
    });
  });

  $('.ModalBlock').click(function () {
    var related = $(this).data('related');
    var type = $(this).data('block');
    var params = {};
    params['title'] = '';
    params['text'] = '';
    params['el'] = '';
    params['related'] = related;
    params['block'] = type;
    customAjax('saveblock', params, function ( r ) {
      $.oc.flashMsg({
        'text': 'Bloque actualizado.',
        'class': 'success',
        'interval': 3
      })
      window.location.reload();
    }, function ( e ) {
      $.oc.flashMsg({
        'text': 'OsPages network error ' + e,
        'class': 'warning',
        'interval': 3
      })
    });
  });

});
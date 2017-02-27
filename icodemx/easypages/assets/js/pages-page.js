/*
 * Handles the Pages main page.
 */
+function($) {
  "use strict";
  var Base = $.oc.foundation.base,
    BaseProto = Base.prototype

  var PagesPage = function() {
    Base.call(this)

    this.init()
  }

  var BaseUrl;

  PagesPage.prototype = Object.create(BaseProto)
  PagesPage.prototype.constructor = PagesPage

  PagesPage.prototype.init = function() {
    this.$masterTabs = $('#pages-master-tabs')
    this.$sidePanel = $('#pages-side-panel')
    this.$pageTree = $('[data-control=treeview]', this.$sidePanel);
    $('[data-control=treeview2]').treeView()
    this.masterTabsObj = this.$masterTabs.data('oc.tab')

    this.registerHandlers()
  }

  PagesPage.prototype.registerHandlers = function() {
    // Item is clicked in the sidebar
    $(document).on('open.oc.treeview', 'form.layout[data-content-id=pages]', this.proxy(this.onSidebarItemClick))

    $(document).on('open.oc.list', this.$sidePanel, this.proxy(this.onSidebarItemClick))

    // A tab is shown / switched
    this.$masterTabs.on('shown.bs.tab', this.proxy(this.onTabShown))

    // All master tabs are closed
    this.$masterTabs.on('afterAllClosed.oc.tab', this.proxy(this.onAllTabsClosed))

    // A master tab is closed
    this.$masterTabs.on('closed.oc.tab', this.proxy(this.onTabClosed))

    // AJAX errors in the master tabs area
    $(document).on('ajaxError', '#pages-master-tabs form', this.proxy(this.onAjaxError))

    // AJAX success in the master tabs area
    $(document).on('ajaxSuccess', '#pages-master-tabs form', this.proxy(this.onAjaxSuccess))

    // Before save a content block
    $(document).on('oc.beforeRequest', '#pages-master-tabs form[data-object-type=content]', this.proxy(this.onBeforeSaveContent))

    // Layout changed
    $(document).on('change', '#pages-master-tabs form[data-object-type=page] select[name="viewBag[layout]"]', this.proxy(this.onLayoutChanged))

    // Create object button click
    $(document).on(
      'click',
      '#pages-side-panel form [data-control=create-object], #pages-side-panel form [data-control=create-template]',
      this.proxy(this.onCreateObject)
    )

    // Submenu item is clicked in the sidebar
    $(document).on('submenu.oc.treeview', 'form.layout[data-content-id=pages]', this.proxy(this.onSidebarSubmenuItemClick))

    // The Delete Object button click
    $(document).on('click', '#pages-side-panel form button[data-control=delete-object], #pages-side-panel form button[data-control=delete-template]',
      this.proxy(this.onDeleteObject))

    // A new tab is added to the editor
    this.$masterTabs.on('initTab.oc.tab', this.proxy(this.onInitTab))

  }

  /*
   * Reloads the Editor form.
   */
  PagesPage.prototype.reloadForm = function($form) {
    var data = {
        id: $('[name=current_id]', $form).val()
      },
      tabId = 'page-' + $('[name=current_id]', $form).val(),
      tab = this.masterTabsObj.findByIdentifier(tabId),
      self = this

    /*
     * Update tab
     */

    $.oc.stripeLoadIndicator.show()
    $form.request('onOpen', {
      data: data
    }).done(function(data) {
      $.oc.stripeLoadIndicator.hide()
      self.$masterTabs.ocTab('updateTab', tab, data.tabTitle, data.tab)
      self.$masterTabs.ocTab('unmodifyTab', tab)
      self.updateModifiedCounter()
    }).always(function() {
      $.oc.stripeLoadIndicator.hide()
    })
  }

  /*
   * Updates the sidebar counter
   */
  PagesPage.prototype.updateModifiedCounter = function() {
    var counters = {
      page: {count: 0}
    }

    $('> div.tab-content > div.tab-pane[data-modified]', this.$masterTabs).each(function() {
      counters['page'].count++
    })

    $.each(counters, function(type, data) {
      $.oc.sideNav.setCounter('pages/' + data.menu, data.count);
    })
  }

  /*
   * Triggered when a tab is displayed. Updated the current selection in the sidebar and sets focus on an editor.
   */
  PagesPage.prototype.onTabShown = function(e) {
    var $tabControl = $(e.target).closest('[data-control=tab]')

    if ($tabControl.attr('id') == 'pages-master-tabs') {
      var dataId = $(e.target).closest('li').attr('data-tab-id'),
        title = $(e.target).attr('title')
      if (title)
        this.setPageTitle(title)

      this.$pageTree.treeView('markActive', dataId.split('-')[1])
      $('[data-control=filelist]', this.$sidePanel).fileList('markActive', dataId)
      $(window).trigger('resize')
    } else if ($tabControl.hasClass('secondary')) {
      // TODO: Focus the code or rich editor here
    }
  }

  /*
   * Triggered when all master tabs are closed.
   */
  PagesPage.prototype.onAllTabsClosed = function() {
    this.$pageTree.treeView('markActive', null)
    $('[data-control=filelist]', this.$sidePanel).fileList('markActive', null)
    this.setPageTitle('')
  }

  /*
   * Triggered when a master tab is closed.
   */
  PagesPage.prototype.onTabClosed = function() {
    this.updateModifiedCounter()
  }

  /*
   * Handles AJAX errors in the master tab forms. Processes the mtime mismatch condition (concurrency).
   */
  PagesPage.prototype.onAjaxError = function(event, context, data, jqXHR) {
    if (context.handler != 'onSave')
      return

    if (jqXHR.responseText == 'mtime-mismatch') {
      event.preventDefault()
      this.handleMtimeMismatch(event.target)
    }
  }

  /*
   * Handles successful AJAX request in the master tab forms. Updates the UI elements and resets the mtime value.
   */
  PagesPage.prototype.onAjaxSuccess = function(event, context, data) {
    var $form = $(event.currentTarget),
      $tabPane = $form.closest('.tab-pane')
    if (data.objectId !== undefined) {
      $('[data-control=delete-button]', $form).removeClass('hide')
      $('[data-control=preview-button]', $form).removeClass('hide')

      if (data.pageUrl !== undefined)
        $('[data-control=preview-button]', $form).attr('href', data.pageUrl)
    }

    if (data.tabTitle !== undefined) {
      this.$masterTabs.ocTab('updateTitle', $tabPane, data.tabTitle)
      this.setPageTitle(data.tabTitle)
    }

    var tabId = data.currentId;

    var self = this;

    this.updateObjectList('page', function() {
      self.$masterTabs.ocTab('updateIdentifier', $tabPane, tabId);
      self.$pageTree.treeView('markActive', tabId);
    });


    if (context.handler == 'onSave' && (!data['X_OCTOBER_ERROR_FIELDS'] && !data['X_OCTOBER_ERROR_MESSAGE']))
      $form.trigger('unchange.oc.changeMonitor')


    $form.find('input[name="current_id"]').val(data.currentId);
    $form.find('input[name="parent_id"]').val(data.parentId);

  }

  PagesPage.prototype.onBeforeSaveContent = function(e, data) {
    var form = e.currentTarget,
      $tabPane = $(form).closest('.tab-pane')

    this.updateContentEditorMode($tabPane, false)

    var extension = this.getContentExtension($tabPane),
      val = ''

    if (extension == 'htm' || extension == 'html')
      val = $('div[data-control=richeditor]', $tabPane).data('oc.richEditor').$textarea.redactor('code.get')
    else {
      var editor = $('[data-control=codeeditor]', $tabPane)
      val = editor.data('oc.codeEditor').editor.getSession().getValue()
    }

    data.options.data['markup'] = val
  }

  /*
   * Updates the browser title when an object is saved.
   */
  PagesPage.prototype.setPageTitle = function(title) {
    $.oc.layout.setPageTitle(title.length ? (title + ' | ') : title)
  }

  /*
   * Updates the sidebar object list.
   */
  PagesPage.prototype.updateObjectList = function(objectType, callback) {
    var $form = $('form[data-object-type=' + objectType + ']', this.$sidePanel),
      objectList = objectType + 'List',
      self = this

    $.oc.stripeLoadIndicator.show()
    $form.request(objectList + '::onUpdate', {
      complete: function(data) {
        $('button[data-control=delete-object], button[data-control=delete-template]', $form).trigger('oc.triggerOn.update')
        if (typeof callback == 'function') {
          callback(data);
        }
      }
    }).always(function() {
      $.oc.stripeLoadIndicator.hide()
    })
  }

  /*
   * Closes deleted page tabs in the editor area.
   */
  PagesPage.prototype.closeTabs = function(data, type) {
    var self = this
    $.each(data.deletedObjects, function() {
      var tabId = 'page' + '-' + data.id,
        tab = self.masterTabsObj.findByIdentifier(tabId)

      $(tab).trigger('close.oc.tab', [{force: true}])
    })
  }

  /*
   * Triggered when an item is clicked in the sidebar. Opens the item in the editor.
   * If the item is already opened, activate its tab in the editor.
   */
  PagesPage.prototype.onSidebarItemClick = function(e) {

    var self = this,
      $item = $(e.relatedTarget),
      $form = $item.closest('form'),
      data = {
        id: $item.data('id')
      },
      tabId = 'page' + '-' + data.id,
      go = (data.id == 1) ? 2 : data.id;

    location.href = BaseUrl + 'update/' + go
    return;
    /*
     * Find if the tab is already opened
     */

    if (this.masterTabsObj.goTo(tabId))
      return false

    /*
     * Open a new tab
     */

    $.oc.stripeLoadIndicator.show()
    $form.request('onOpen', {
      data: data
    }).done(function(data) {
      self.$masterTabs.ocTab('addTab', data.tabTitle, data.tab, tabId, $form.data('type-icon'))
    }).always(function() {
      $.oc.stripeLoadIndicator.hide()
    })

    return false
  }

  /*
   * Triggered when the Add button is clicked on the sidebar
   */
  PagesPage.prototype.onCreateObject = function(e) {
    var self = this,
      $button = $(e.target),
      $form = $button.closest('form'),
      parent = $button.data('parent') !== undefined ? $button.data('parent') : null,
      type = 'page',
      tabId = type + Math.random()

    $.oc.stripeLoadIndicator.show()
    $form.request('onCreateObject', {
      data: {
        type: type,
        parent: parent
      }
    }).done(function(data) {
      self.$masterTabs.ocTab('addTab', data.tabTitle, data.tab, tabId, $form.data('type-icon') + ' new-template')
      $('#layout-side-panel').trigger('close.oc.sidePanel')
      self.setPageTitle(data.tabTitle)
    }).always(function() {
      $.oc.stripeLoadIndicator.hide()
    })

    e.stopPropagation()

    return false
  }

  /*
   * Triggered when an item is clicked in the sidebar submenu
   */
  PagesPage.prototype.onSidebarSubmenuItemClick = function(e) {
    var parent = $(e.clickEvent.target).data('parent');
    location.href = BaseUrl + 'create/' + parent;
    return false;
  }

  /*
   * Triggered when the Delete button is clicked on the sidebar
   */
  PagesPage.prototype.onDeleteObject = function(e) {
    var $el = $(e.target),
      $form = $el.closest('form'),
      objectType = $form.data('object-type'),
      self = this;

    if (!confirm($el.data('confirmation')))
      return;

    this.disableNotChecked($form, objectType, function(obj) {
      $form.request('onDeleteObjects', {
        data: {
          type: objectType
        },
        success: function(data) {
          self.enableAgain($form);
          if (data.error !== undefined && $.type(data.error) === 'string' && data.error.length)
            $.oc.flashMsg({text: data.error, 'class': 'error'})
        },
        complete: function() {
          self.updateObjectList(obj)
        }
      })
    });

    return false
  }

  PagesPage.prototype.disableNotChecked = function(form, obj, callback) {
    //little tweak to avoid to send all items becase its inneficient
    var items = form.find('.checkbox input:not(:checked)');
    $.each(items, function(i, o) {
      $(o).attr('disabled', 'disabled');
    });
    if (typeof callback == 'function') {
      callback(obj);
    }
  }

  PagesPage.prototype.enableAgain = function(form) {
    var items = form.find('.checkbox input');
    $.each(items, function(i, o) {
      $(o).removeAttr('disabled');
    });
  };

  /*
   * Triggered when a static page layout changes
   */
  PagesPage.prototype.onLayoutChanged = function(e) {
    var
      self = this,
      $el = $(e.target),
      $form = $el.closest('form'),
      $pane = $form.closest('.tab-pane'),
      data = {
        type: $('[name=objectType]', $form).val(),
        theme: $('[name=theme]', $form).val(),
        path: $('[name=objectPath]', $form).val()
      },
      tab = $pane.data('tab')

    // $form.trigger('unchange.oc.changeMonitor')
    $form.changeMonitor('dispose')

    $.oc.stripeLoadIndicator.show()

    $form
      .request('onUpdatePageLayout', {
        data: data
      })
      .done(function(data) {
        self.$masterTabs.ocTab('updateTab', tab, data.tabTitle, data.tab)
      })
      .always(function() {
        $.oc.stripeLoadIndicator.hide()
        $('form:first', $pane).changeMonitor().trigger('change')
      })
  }

  /*
   * Triggered when a new tab is added to the Editor
   */
  PagesPage.prototype.onInitTab = function(e, data) {
    if ($(e.target).attr('id') != 'pages-master-tabs')
      return

    var $collapseIcon = $('<a href="javascript:;" class="tab-collapse-icon tabless"><i class="icon-chevron-up"></i></a>'),
      $panel = $('.form-tabless-fields', data.pane),
      $secondaryPanel = $('.control-tabs.secondary-tabs', data.pane),
      $primaryPanel = $('.control-tabs.primary-tabs', data.pane),
      hasSecondaryTabs = $secondaryPanel.length > 0

    $secondaryPanel.addClass('secondary-content-tabs')

    $panel.append($collapseIcon)

    if (!hasSecondaryTabs) {
      $('.tab-pane', $primaryPanel).addClass('pane-compact')
    }

    $collapseIcon.click(function() {
      $panel.toggleClass('collapsed')

      if (typeof(localStorage) !== 'undefined')
        localStorage.ocPagesTablessCollapsed = $panel.hasClass('collapsed') ? 1 : 0

      window.setTimeout(function() {
        $(window).trigger('oc.updateUi')
      }, 500)

      return false
    })

    var $primaryCollapseIcon = $('<a href="javascript:;" class="tab-collapse-icon primary"><i class="icon-chevron-down"></i></a>'),
      $primaryTabContainer = $('.nav-tabs', $primaryPanel)

    $primaryTabContainer.addClass('master-area')

    if ($primaryPanel.length > 0) {
      $secondaryPanel.append($primaryCollapseIcon)

      $primaryCollapseIcon.click(function() {
        $primaryPanel.toggleClass('collapsed')
        $secondaryPanel.toggleClass('primary-collapsed')
        $(window).trigger('oc.updateUi')
        if (typeof(localStorage) !== 'undefined')
          localStorage.ocPagesPrimaryCollapsed = $primaryPanel.hasClass('collapsed') ? 1 : 0
        return false
      })
    } else {
      $secondaryPanel.addClass('primary-collapsed')
    }

    if (typeof(localStorage) !== 'undefined') {
      if (!$('a', data.tab).hasClass('new-template') && localStorage.ocPagesTablessCollapsed == 1)
        $panel.addClass('collapsed')

      if (localStorage.ocPagesPrimaryCollapsed == 1 && hasSecondaryTabs) {
        $primaryPanel.addClass('collapsed')
        $secondaryPanel.addClass('primary-collapsed')
      }
    }

    var $form = $('form', data.pane),
      self = this,
      $panel = $('.form-tabless-fields', data.pane)

    this.updateContentEditorMode(data.pane, true)

    $form.on('changed.oc.changeMonitor', function() {
      $panel.trigger('modified.oc.tab')
      self.updateModifiedCounter()
    })

    $form.on('unchanged.oc.changeMonitor', function() {
      $panel.trigger('unmodified.oc.tab')
      self.updateModifiedCounter()
    })
  }

  /*
   * Updates the content editor to correspond the conten file extension
   */
  PagesPage.prototype.updateContentEditorMode = function(pane, initialization) {
    if ($('[data-toolbar-type]', pane).data('toolbar-type') !== 'content')
      return

    var extension = this.getContentExtension(pane),
      mode = 'html',
      editor = $('[data-control=codeeditor]', pane)

    if (extension == 'html')
      extension = 'htm'

    if (initialization)
      $(pane).data('prev-extension', extension)

    if (extension == 'htm') {
      $('[data-field-name=markup]', pane).hide()
      $('[data-field-name=markup_html]', pane).show()

      if (!initialization && $(pane).data('prev-extension') != 'htm') {
        var val = editor.data('oc.codeEditor').editor.getSession().getValue()
        $('div[data-control=richeditor]', pane).data('oc.richEditor').$textarea.redactor('code.set', val)
      }
    } else {
      $('[data-field-name=markup]', pane).show()
      $('[data-field-name=markup_html]', pane).hide()

      if (!initialization && $(pane).data('prev-extension') == 'htm') {
        var val = $('div[data-control=richeditor]', pane).data('oc.richEditor').$textarea.redactor('code.get')
        editor.data('oc.codeEditor').editor.getSession().setValue(val)
      }

      var modes = $.oc.codeEditorExtensionModes

      if (modes[extension] !== undefined)
        mode = modes[extension];

      var setEditorMode = function() {
        window.setTimeout(function() {
          editor.data('oc.codeEditor').editor.getSession().setMode({path: 'ace/mode/' + mode})
        }, 200)
      }

      if (initialization)
        editor.on('oc.codeEditorReady', setEditorMode)
      else
        setEditorMode()
    }

    if (!initialization)
      $(pane).data('prev-extension', extension)
  }

  /*
   * Returns the content file extension
   */
  PagesPage.prototype.getContentExtension = function(form) {
    var fileName = $('input[name=fileName]', form).val(),
      parts = fileName.split('.')

    if (parts.length >= 2)
      return parts.pop().toLowerCase()

    return 'htm'
  }

  $(document).ready(function() {
    BaseUrl = $('.PageBuilder').data('uri') + '/';
    $.oc.pagesPage = new PagesPage()
    $('li[data-override="goto"]').click(function(e){
      e.preventDefault();
      location.href = $(this).find('a').attr('href');
    });
  })

}(window.jQuery);
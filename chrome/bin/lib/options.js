// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var ErrorMessage, Message, Options, R_CLEAN_QUERY, R_VALID_KEY, R_WHITESPACE, SuccessMessage, ValidationError, ValidationWarning, WarningMessage, activateDraggables, activateModifications, activateSelections, activateTooltips, activeOrder, bindSaveEvent, clearContext, closeWizard, deleteOrders, deriveOrder, ext, feedback, feedbackAdded, getSelectedOrders, isKeyValid, isNumberAvailable, load, loadDeveloperTools, loadFrequencies, loadFrequenciesSaveEvents, loadLogger, loadLoggerSaveEvents, loadNotificationSaveEvents, loadNotifications, loadOrder, loadOrderControlEvents, loadOrderRows, loadOrders, loadSaveEvents, openWizard, options, paginate, refreshResetButton, refreshSelectButtons, reorderOrders, resetWizard, saveOrder, searchOrders, searchResults, setContext, trimToLower, trimToUpper, validateOrder, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  R_CLEAN_QUERY = /[^\w\s]/g;

  R_VALID_KEY = /^[A-Z0-9]*\.[A-Z0-9]*$/i;

  R_WHITESPACE = /\s+/;

  activeOrder = null;

  ext = chrome.extension.getBackgroundPage().ext;

  feedbackAdded = false;

  searchResults = null;

  bindSaveEvent = function(selector, type, option, evaluate, callback) {
    log.trace();
    return $(selector).on(type, function() {
      var $this, key, value;

      $this = $(this);
      key = '';
      value = null;
      store.modify(option, function(data) {
        key = $this.attr('id').match(new RegExp("^" + option + "(\\S*)"))[1];
        key = key[0].toLowerCase() + key.substr(1);
        return data[key] = value = evaluate.call($this, key);
      });
      return typeof callback === "function" ? callback($this, key, value) : void 0;
    });
  };

  load = function() {
    log.trace();
    $('#analytics').prop('checked', store.get('analytics'));
    loadSaveEvents();
    loadFrequencies();
    loadOrders();
    loadNotifications();
    return loadDeveloperTools();
  };

  loadDeveloperTools = function() {
    log.trace();
    return loadLogger();
  };

  loadFrequencies = function() {
    var freq, frequency, option, _i, _len, _ref;

    log.trace();
    frequency = $('#frequency');
    frequency.remove('option');
    _ref = ext.config.frequencies;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      freq = _ref[_i];
      option = $('<option/>', {
        text: freq.text,
        value: freq.value
      });
      option.prop('selected', freq.value === frequency);
      frequency.append(option);
    }
    return loadFrequenciesSaveEvents();
  };

  loadFrequenciesSaveEvents = function() {
    log.trace();
    return $('#frequency').on('change', function() {
      var value;

      value = $(this).val();
      log.debug("Changing frequency to '" + value + "'");
      store.set('frequency', parseInt(frequency, 10));
      ext.updateOrders();
      return analytics.track('General', 'Changed', 'Frequency', value);
    });
  };

  loadLogger = function() {
    var level, logger, loggerLevel, option, _i, _len, _ref;

    log.trace();
    logger = store.get('logger');
    $('#loggerEnabled').prop('checked', logger.enabled);
    loggerLevel = $('#loggerLevel');
    loggerLevel.find('option').remove();
    _ref = log.LEVELS;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      level = _ref[_i];
      option = $('<option/>', {
        text: i18n.get("opt_logger_level_" + level.name + "_text"),
        value: level.value
      });
      option.prop('selected', level.value === logger.level);
      loggerLevel.append(option);
    }
    if (!loggerLevel.find('option[selected]').length) {
      loggerLevel.find("option[value='" + log.DEBUG + "']").prop('selected', true);
    }
    return loadLoggerSaveEvents();
  };

  loadLoggerSaveEvents = function() {
    log.trace();
    return bindSaveEvent('#loggerEnabled, #loggerLevel', 'change', 'logger', function(key) {
      var value;

      value = key === 'level' ? this.val() : this.is(':checked');
      log.debug("Changing logging " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      var logger;

      logger = store.get('logger');
      chrome.extension.getBackgroundPage().log.config = log.config = logger;
      return analytics.track('Logging', 'Changed', key[0].toUpperCase() + key.substr(1), Number(value));
    });
  };

  loadNotifications = function() {
    var badges, duration, enabled, _ref;

    log.trace();
    _ref = store.get('notifications'), badges = _ref.badges, duration = _ref.duration, enabled = _ref.enabled;
    $('#notificationsBadges').prop('checked', badges);
    $('#notificationsDuration').val(duration > 0 ? duration * .001 : 0);
    $('#notificationsEnabled').prop('checked', enabled);
    return loadNotificationSaveEvents();
  };

  loadNotificationSaveEvents = function() {
    log.trace();
    return bindSaveEvent('#notificationsBadges, #notificationsDuration, #notificationsEnabled', 'change', 'notifications', function(key) {
      var milliseconds, value;

      value = key === 'duration' ? (milliseconds = this.val(), milliseconds ? parseInt(milliseconds, 10) * 1000 : 0) : this.is(':checked');
      log.debug("Changing notifications " + key + " to '" + value + "'");
      return value;
    }, function(jel, key, value) {
      return analytics.track('Notifications', 'Changed', key[0].toUpperCase() + key.substr(1), Number(value));
    });
  };

  loadOrder = function(order) {
    var alignCenter, row;

    log.trace();
    log.debug('Creating a row for the following order...', order);
    row = $('<tr/>', {
      draggable: true
    });
    alignCenter = {
      css: {
        'text-align': 'center'
      }
    };
    row.append($('<td/>', alignCenter).append($('<input/>', {
      title: i18n.get('opt_select_box'),
      type: 'checkbox',
      value: order.key
    })));
    row.append($('<td/>').append($('<span/>', {
      text: order.label,
      title: i18n.get('opt_order_modify_title', order.label)
    })));
    row.append($('<td/>').append($('<span/>').append($('<a/>', {
      href: ext.getOrderUrl(order),
      target: '_blank',
      text: order.number,
      title: i18n.get('opt_order_title')
    }))));
    row.append($('<td/>').append($('<span/>', {
      text: order.code
    })));
    row.append($('<td/>').append($('<span/>', {
      text: ext.getStatusText(order)
    })));
    row.append($('<td/>').append(order.trackingUrl ? $('<a/>', {
      href: order.trackingUrl,
      target: '_blank',
      text: i18n.get('opt_track_text'),
      title: i18n.get('opt_track_title')
    }) : '&nbsp;'));
    row.append($('<td/>').append($('<span/>', {
      "class": 'muted',
      text: '::::',
      title: i18n.get('opt_order_move_title', order.label)
    })));
    return row;
  };

  loadOrderControlEvents = function() {
    var filter, limit, selectedOrders, validationErrors, _i, _len, _ref;

    log.trace();
    $('#order_wizard [tabify], #order_cancel_btn').on('click', function() {
      return closeWizard();
    });
    $('#order_reset_btn').on('click', function() {
      return resetWizard();
    });
    filter = $('#order_filter');
    filter.find('option').remove();
    _ref = ext.config.options.limits;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      limit = _ref[_i];
      filter.append($('<option/>', {
        text: limit
      }));
    }
    filter.append($('<option/>', {
      disabled: 'disabled',
      text: '-----'
    }));
    filter.append($('<option/>', {
      text: i18n.get('opt_show_all_text'),
      value: 0
    }));
    store.init('options_limit', parseInt($('#order_filter').val(), 10));
    limit = store.get('options_limit');
    $('#order_filter option').each(function() {
      var $this;

      $this = $(this);
      return $this.prop('selected', limit === parseInt($this.val(), 10));
    });
    $('#order_filter').on('change', function() {
      store.set('options_limit', parseInt($(this).val(), 10));
      return loadOrderRows(searchResults != null ? searchResults : ext.orders);
    });
    $('#order_search :reset').on('click', function() {
      $('#order_search :text').val('');
      return searchOrders();
    });
    $('#order_controls').on('submit', function() {
      return searchOrders($('#order_search :text').val());
    });
    $('#order_delete_btn').on('click', function() {
      $(this).hide();
      return $('#order_confirm_delete').css('display', 'inline-block');
    });
    $('#order_undo_delete_btn').on('click', function() {
      $('#order_confirm_delete').hide();
      return $('#order_delete_btn').show();
    });
    $('#order_confirm_delete_btn').on('click', function() {
      $('#order_confirm_delete').hide();
      $('#order_delete_btn').show();
      deleteOrders([activeOrder]);
      return closeWizard();
    });
    validationErrors = [];
    $('#order_wizard').on('hide', function() {
      var error, _j, _len1, _results;

      _results = [];
      for (_j = 0, _len1 = validationErrors.length; _j < _len1; _j++) {
        error = validationErrors[_j];
        _results.push(error.hide());
      }
      return _results;
    });
    $('#order_save_btn').on('click', function() {
      var error, order, _j, _k, _len1, _len2, _results;

      order = deriveOrder();
      for (_j = 0, _len1 = validationErrors.length; _j < _len1; _j++) {
        error = validationErrors[_j];
        error.hide();
      }
      validationErrors = validateOrder(order);
      if (validationErrors.length) {
        _results = [];
        for (_k = 0, _len2 = validationErrors.length; _k < _len2; _k++) {
          error = validationErrors[_k];
          _results.push(error.show());
        }
        return _results;
      } else {
        validationErrors = [];
        $.extend(activeOrder, order);
        saveOrder(activeOrder);
        $('#order_search :reset').hide();
        $('#order_search :text').val('');
        return closeWizard();
      }
    });
    $('#add_btn').on('click', function() {
      return openWizard(null);
    });
    selectedOrders = [];
    $('#delete_wizard').on('hide', function() {
      selectedOrders = [];
      return $('#delete_items li').remove();
    });
    $('#delete_btn').on('click', function() {
      var deleteItems, order, _j, _len1;

      deleteItems = $('#delete_items');
      selectedOrders = getSelectedOrders();
      deleteItems.find('li').remove();
      for (_j = 0, _len1 = selectedOrders.length; _j < _len1; _j++) {
        order = selectedOrders[_j];
        deleteItems.append($('<li/>', {
          text: "" + order.label + " (" + order.number + ")"
        }));
      }
      return $('#delete_wizard').modal('show');
    });
    $('#delete_cancel_btn, #delete_no_btn').on('click', function() {
      return $('#delete_wizard').modal('hide');
    });
    return $('#delete_yes_btn').on('click', function() {
      deleteOrders(selectedOrders);
      return $('#delete_wizard').modal('hide');
    });
  };

  loadOrderRows = function(orders, pagination) {
    var order, table, _i, _len;

    if (orders == null) {
      orders = ext.orders;
    }
    if (pagination == null) {
      pagination = true;
    }
    log.trace();
    table = $('#orders');
    table.find('tbody tr').remove();
    if (orders.length) {
      for (_i = 0, _len = orders.length; _i < _len; _i++) {
        order = orders[_i];
        table.append(loadOrder(order));
      }
      if (pagination) {
        paginate(orders);
      }
      activateTooltips(table);
      activateDraggables();
      activateModifications();
      return activateSelections();
    } else {
      return table.find('tbody').append($('<tr/>').append($('<td/>', {
        colspan: table.find('thead th').length,
        html: i18n.get('opt_no_orders_found_text')
      })));
    }
  };

  loadOrders = function() {
    log.trace();
    loadOrderControlEvents();
    return loadOrderRows();
  };

  loadSaveEvents = function() {
    log.trace();
    return $('#analytics').on('change', function() {
      var enabled;

      enabled = $(this).is(':checked');
      log.debug("Changing analytics to '" + enabled + "'");
      if (enabled) {
        store.set('analytics', true);
        chrome.extension.getBackgroundPage().analytics.add();
        analytics.add();
        return analytics.track('General', 'Changed', 'Analytics', 1);
      } else {
        analytics.track('General', 'Changed', 'Analytics', 0);
        analytics.remove();
        chrome.extension.getBackgroundPage().analytics.remove();
        return store.set('analytics', false);
      }
    });
  };

  deleteOrders = function(orders) {
    var i, keep, keys, order, _i, _len, _ref, _ref1;

    log.trace();
    keys = (function() {
      var _i, _len, _results;

      _results = [];
      for (_i = 0, _len = orders.length; _i < _len; _i++) {
        order = orders[_i];
        _results.push(order.key);
      }
      return _results;
    })();
    if (keys.length) {
      keep = [];
      _ref = ext.orders;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        order = _ref[i];
        if (!(_ref1 = order.key, __indexOf.call(keys, _ref1) < 0)) {
          continue;
        }
        orders.index = i;
        keep.push(order);
      }
      store.set('orders', keep);
      ext.updateOrders();
      if (keys.length > 1) {
        log.debug("Deleted " + keys.length + " orders");
        analytics.track('Orders', 'Deleted', "Count[" + keys.length + "]");
      } else {
        order = orders[0];
        log.debug("Deleted " + order.label + " order");
        analytics.track('Orders', 'Deleted', order.label);
      }
      return loadOrderRows(searchResults != null ? searchResults : ext.orders);
    }
  };

  reorderOrders = function(fromIndex, toIndex) {
    var orders;

    log.trace();
    orders = ext.orders;
    if ((fromIndex != null) && (toIndex != null)) {
      orders[fromIndex].index = toIndex;
      orders[toIndex].index = fromIndex;
    }
    store.set('orders', orders);
    return ext.updateOrders();
  };

  saveOrder = function(order) {
    var action, i, isNew, orders, temp, _i, _len;

    log.trace();
    log.debug('Saving the following order...', order);
    isNew = order.key == null;
    orders = store.get('orders');
    if (isNew) {
      order.key = utils.keyGen();
      orders.push(order);
    } else {
      for (i = _i = 0, _len = orders.length; _i < _len; i = ++_i) {
        temp = orders[i];
        if (!(temp.key === order.key)) {
          continue;
        }
        orders[i] = order;
        break;
      }
    }
    store.set('orders', orders);
    ext.updateOrders();
    loadOrderRows();
    action = isNew ? 'Added' : 'Saved';
    analytics.track('Orders', action, order.label);
    return order;
  };

  ValidationError = (function(_super) {
    __extends(ValidationError, _super);

    function ValidationError(id, key) {
      this.id = id;
      this.key = key;
      this.className = 'error';
    }

    ValidationError.prototype.hide = function() {
      var field;

      field = $("#" + this.id);
      field.parents('.control-group:first').removeClass(this.className);
      return field.parents('.controls:first').find('.help-block').remove();
    };

    ValidationError.prototype.show = function() {
      var field;

      field = $("#" + this.id);
      field.parents('.control-group:first').addClass(this.className);
      return field.parents('.controls:first').append($('<span/>', {
        "class": 'help-block',
        html: i18n.get(this.key)
      }));
    };

    return ValidationError;

  })(utils.Class);

  ValidationWarning = (function(_super) {
    __extends(ValidationWarning, _super);

    function ValidationWarning(id, key) {
      this.id = id;
      this.key = key;
      this.className = 'warning';
    }

    return ValidationWarning;

  })(ValidationError);

  isKeyValid = function(key) {
    log.trace();
    log.debug("Validating order key '" + key + "'");
    return R_VALID_KEY.test(key);
  };

  isNumberAvailable = function(number) {
    log.trace();
    log.debug("Validating order number '" + number + "'");
    return !ext.queryOrder(function(order) {
      return order.number === number;
    });
  };

  validateOrder = function(order) {
    var errors, isNew;

    log.trace();
    isNew = order.key == null;
    errors = [];
    log.debug('Validating the following order...', order);
    if (!order.label) {
      errors.push(new ValidationError('order_label', 'opt_order_label_invalid'));
    }
    if (!order.number) {
      errors.push(new ValidationError('order_number', 'opt_order_number_invalid'));
    }
    if (!isNumberAvailable(order.number)) {
      errors.push(new ValidationError('order_number', 'opt_order_number_unavailable'));
    }
    if (!order.code) {
      errors.push(new ValidationError('order_code', 'opt_order_code_invalid'));
    }
    log.debug('Following validation errors were found...', errors);
    return errors;
  };

  Message = (function(_super) {
    __extends(Message, _super);

    function Message(block) {
      this.block = block;
      this.className = 'alert-info';
      this.headerKey = 'opt_message_header';
    }

    Message.prototype.hide = function() {
      var _ref;

      return (_ref = this.alert) != null ? _ref.alert('close') : void 0;
    };

    Message.prototype.show = function() {
      if (this.headerKey && (this.header == null)) {
        this.header = i18n.get(this.headerKey);
      }
      if (this.messageKey && (this.message == null)) {
        this.message = i18n.get(this.messageKey);
      }
      this.alert = $('<div/>', {
        "class": "alert " + this.className
      });
      if (this.block) {
        this.alert.addClass('alert-block');
      }
      this.alert.append($('<button/>', {
        "class": 'close',
        'data-dismiss': 'alert',
        html: '&times;',
        type: 'button'
      }));
      if (this.header) {
        this.alert.append($("<" + (this.block ? 'h4' : 'strong') + "/>", {
          html: this.header
        }));
      }
      this.alert.append(this.block ? this.message : this.message ? " " + this.message : void 0);
      return this.alert.prependTo($($('#navigation li.active a').attr('tabify')));
    };

    return Message;

  })(utils.Class);

  ErrorMessage = (function(_super) {
    __extends(ErrorMessage, _super);

    function ErrorMessage(block) {
      this.block = block;
      this.className = 'alert-error';
      this.headerKey = 'opt_message_error_header';
    }

    return ErrorMessage;

  })(Message);

  SuccessMessage = (function(_super) {
    __extends(SuccessMessage, _super);

    function SuccessMessage(block) {
      this.block = block;
      this.className = 'alert-success';
      this.headerKey = 'opt_message_success_header';
    }

    return SuccessMessage;

  })(Message);

  WarningMessage = (function(_super) {
    __extends(WarningMessage, _super);

    function WarningMessage(block) {
      this.block = block;
      this.className = '';
      this.headerKey = 'opt_message_warning_header';
    }

    return WarningMessage;

  })(Message);

  activateDraggables = function() {
    var dragSource, draggables, table;

    log.trace();
    table = $('#orders');
    dragSource = null;
    draggables = table.find('[draggable]');
    draggables.off('dragstart dragend dragenter dragover drop');
    draggables.on('dragstart', function(e) {
      var $this;

      $this = $(this);
      dragSource = this;
      table.removeClass('table-hover');
      $this.addClass('dnd-moving');
      $this.find('[data-original-title]').tooltip('hide');
      e.originalEvent.dataTransfer.effectAllowed = 'move';
      return e.originalEvent.dataTransfer.setData('text/html', $this.html());
    });
    draggables.on('dragend', function(e) {
      draggables.removeClass('dnd-moving dnd-over');
      table.addClass('table-hover');
      return dragSource = null;
    });
    draggables.on('dragenter', function(e) {
      var $this;

      $this = $(this);
      draggables.not($this).removeClass('dnd-over');
      return $this.addClass('dnd-over');
    });
    draggables.on('dragover', function(e) {
      e.preventDefault();
      e.originalEvent.dataTransfer.dropEffect = 'move';
      return false;
    });
    return draggables.on('drop', function(e) {
      var $dragSource, $this, fromIndex, toIndex;

      $dragSource = $(dragSource);
      e.stopPropagation();
      if (dragSource !== this) {
        $this = $(this);
        $dragSource.html($this.html());
        $this.html(e.originalEvent.dataTransfer.getData('text/html'));
        activateTooltips(table);
        activateModifications();
        activateSelections();
        fromIndex = $dragSource.index();
        toIndex = $this.index();
        if (searchResults != null) {
          fromIndex = searchResults[fromIndex].index;
          toIndex = searchResults[toIndex].index;
        }
        reorderOrders(fromIndex, toIndex);
      }
      return false;
    });
  };

  activateModifications = function() {
    log.trace();
    return $('#orders tbody tr td:not(:first-child)').off('click').on('click', function() {
      var activeKey;

      activeKey = $(this).parents('tr:first').find(':checkbox').val();
      return openWizard(ext.queryOrder(function(order) {
        return order.key === activeKey;
      }));
    });
  };

  activateSelections = function() {
    var selectBoxes, table;

    log.trace();
    table = $('#orders');
    selectBoxes = table.find('tbody :checkbox');
    selectBoxes.off('change').on('change', function() {
      var $this, messageKey;

      $this = $(this);
      messageKey = 'opt_select_box';
      if ($this.is(':checked')) {
        messageKey += '_checked';
      }
      $this.attr('data-original-title', i18n.get(messageKey));
      return refreshSelectButtons();
    });
    return table.find('thead :checkbox').off('change').on('change', function() {
      var $this, checked, messageKey;

      $this = $(this);
      checked = $this.is(':checked');
      messageKey = 'opt_select_all_box';
      if (checked) {
        messageKey += '_checked';
      }
      $this.attr('data-original-title', i18n.get(messageKey));
      selectBoxes.prop('checked', checked);
      return refreshSelectButtons();
    });
  };

  activateTooltips = function(selector) {
    var base;

    log.trace();
    base = $(selector || document);
    base.find('[data-original-title]').each(function() {
      var $this;

      $this = $(this);
      $this.tooltip('destroy');
      $this.attr('title', $this.attr('data-original-title'));
      return $this.removeAttr('data-original-title');
    });
    return base.find('[title]').each(function() {
      var $this, placement, _ref;

      $this = $(this);
      placement = $this.attr('data-placement');
      placement = placement != null ? trimToLower(placement) : 'top';
      return $this.tooltip({
        container: (_ref = $this.attr('data-container')) != null ? _ref : 'body',
        placement: placement
      });
    });
  };

  clearContext = function() {
    return setContext();
  };

  closeWizard = function() {
    clearContext();
    return $('#order_wizard').modal('hide');
  };

  deriveOrder = function() {
    var order, _ref, _ref1, _ref2, _ref3;

    log.trace();
    order = {
      code: $('#order_code').val().trim(),
      label: $('#order_label').val().trim(),
      number: $('#order_number').val().trim(),
      error: (_ref = activeOrder.error) != null ? _ref : '',
      index: (_ref1 = activeOrder.index) != null ? _ref1 : ext.orders.length,
      key: activeOrder.key,
      trackingUrl: (_ref2 = activeOrder.trackingUrl) != null ? _ref2 : '',
      updates: (_ref3 = activeOrder.updates) != null ? _ref3 : []
    };
    log.debug('Following order was derived...', order);
    return order;
  };

  feedback = function() {
    var UserVoice, script, uv;

    log.trace();
    if (!feedbackAdded) {
      uv = document.createElement('script');
      uv.async = 'async';
      uv.src = "https://widget.uservoice.com/" + ext.config.options.userVoice.id + ".js";
      script = document.getElementsByTagName('script')[0];
      script.parentNode.insertBefore(uv, script);
      UserVoice = window.UserVoice || (window.UserVoice = []);
      UserVoice.push([
        'showTab', 'classic_widget', {
          mode: 'full',
          primary_color: '#333',
          link_color: '#08c',
          default_mode: 'feedback',
          forum_id: ext.config.options.userVoice.forum,
          tab_label: i18n.get('opt_feedback_button'),
          tab_color: '#333',
          tab_position: 'middle-left',
          tab_inverted: true
        }
      ]);
      return feedbackAdded = true;
    }
  };

  getSelectedOrders = function() {
    var selectedKeys;

    selectedKeys = [];
    $('#orders tbody :checkbox:checked').each(function() {
      return selectedKeys.push($(this).val());
    });
    return ext.queryOrders(function(order) {
      var _ref;

      return _ref = order.key, __indexOf.call(selectedKeys, _ref) >= 0;
    });
  };

  openWizard = function(order) {
    if (arguments.length) {
      setContext(order);
    }
    return $('#order_wizard').modal('show');
  };

  paginate = function(orders) {
    var children, limit, list, page, pages, pagination, refreshPagination, _i;

    log.trace();
    limit = parseInt($('#order_filter').val(), 10);
    pagination = $('#pagination');
    if ((orders.length > limit && limit > 0)) {
      children = pagination.find('ul li');
      pages = Math.ceil(orders.length / limit);
      refreshPagination = function(page) {
        var end, start;

        if (page == null) {
          page = 1;
        }
        start = limit * (page - 1);
        end = start + limit;
        loadOrderRows(orders.slice(start, end), false);
        pagination.find('ul li:first-child').each(function() {
          var $this;

          $this = $(this);
          if (page === 1) {
            return $this.addClass('disabled');
          } else {
            return $this.removeClass('disabled');
          }
        });
        pagination.find('ul li:not(:first-child, :last-child)').each(function() {
          var $this;

          $this = $(this);
          if (page === parseInt($this.text(), 10)) {
            return $this.addClass('active');
          } else {
            return $this.removeClass('active');
          }
        });
        return pagination.find('ul li:last-child').each(function() {
          var $this;

          $this = $(this);
          if (page === pages) {
            return $this.addClass('disabled');
          } else {
            return $this.removeClass('disabled');
          }
        });
      };
      if (pages !== children.length - 2) {
        children.remove();
        list = pagination.find('ul');
        list.append($('<li/>').append($('<a>&laquo;</a>')));
        for (page = _i = 1; 1 <= pages ? _i <= pages : _i >= pages; page = 1 <= pages ? ++_i : --_i) {
          list.append($('<li/>').append($("<a>" + page + "</a>")));
        }
        list.append($('<li/>').append($('<a>&raquo;</a>')));
      }
      pagination.find('ul li').off('click');
      pagination.find('ul li:first-child').on('click', function() {
        if (!$(this).hasClass('disabled')) {
          return refreshPagination(pagination.find('ul li.active').index() - 1);
        }
      });
      pagination.find('ul li:not(:first-child, :last-child)').on('click', function() {
        var $this;

        $this = $(this);
        if (!$this.hasClass('active')) {
          return refreshPagination($this.index());
        }
      });
      pagination.find('ul li:last-child').on('click', function() {
        if (!$(this).hasClass('disabled')) {
          return refreshPagination(pagination.find('ul li.active').index() + 1);
        }
      });
      refreshPagination();
      return pagination.show();
    } else {
      return pagination.hide().find('ul li').remove();
    }
  };

  refreshResetButton = function() {
    var container, resetButton;

    log.trace();
    container = $('#order_search');
    resetButton = container.find(':reset');
    if (container.find(':text').val()) {
      container.addClass('input-prepend');
      return resetButton.show();
    } else {
      resetButton.hide();
      return container.removeClass('input-prepend');
    }
  };

  refreshSelectButtons = function() {
    var selections;

    log.trace();
    selections = $('#orders tbody :checkbox:checked');
    return $('#delete_btn').prop('disabled', selections.length === 0);
  };

  resetWizard = function() {
    log.trace();
    if (activeOrder == null) {
      activeOrder = {};
    }
    $('#order_wizard .modal-header h3').html(activeOrder.key != null ? i18n.get('opt_order_modify_title', activeOrder.label) : i18n.get('opt_order_new_header'));
    $('#order_code').val(activeOrder.code || '');
    $('#order_label').val(activeOrder.label || '');
    $('#order_number').val(activeOrder.number || '');
    return $('#order_delete_btn').each(function() {
      var $this;

      $this = $(this);
      if (activeOrder.key != null) {
        return $this.show();
      } else {
        return $this.hide();
      }
    });
  };

  searchOrders = function(query) {
    var expression, keyword, keywords;

    if (query == null) {
      query = '';
    }
    log.trace();
    keywords = query.replace(R_CLEAN_QUERY, '').split(R_WHITESPACE);
    if (keywords.length) {
      expression = RegExp("" + (((function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = keywords.length; _i < _len; _i++) {
          keyword = keywords[_i];
          if (keyword) {
            _results.push(keyword);
          }
        }
        return _results;
      })()).join('|')), "i");
      searchResults = ext.queryOrders(function(order) {
        return expression.test("" + order.code + " " + order.label + " " + order.number);
      });
    } else {
      searchResults = null;
    }
    loadOrderRows(searchResults != null ? searchResults : ext.orders);
    refreshResetButton();
    return refreshSelectButtons();
  };

  setContext = function(order) {
    if (order == null) {
      order = {};
    }
    log.trace();
    activeOrder = {};
    $.extend(activeOrder, order);
    return resetWizard();
  };

  trimToLower = function(str) {
    if (str == null) {
      str = '';
    }
    return str.trim().toLowerCase();
  };

  trimToUpper = function(str) {
    if (str == null) {
      str = '';
    }
    return str.trim().toUpperCase();
  };

  options = window.options = new (Options = (function(_super) {
    __extends(Options, _super);

    function Options() {
      _ref = Options.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Options.prototype.init = function() {
      var initialTabChange, navHeight, optionsActiveTab;

      log.trace();
      log.info('Initializing the options page');
      if (store.get('analytics')) {
        analytics.add();
      }
      feedback();
      i18n.init();
      $('.year-repl').html("" + (new Date().getFullYear()));
      initialTabChange = true;
      $('a[tabify]').on('click', function() {
        var id, nav, parent, target;

        target = $(this).attr('tabify');
        nav = $("#navigation a[tabify='" + target + "']");
        parent = nav.parent('li');
        if (!parent.hasClass('active')) {
          parent.siblings().removeClass('active');
          parent.addClass('active');
          $(target).show().siblings('.tab').hide();
          id = nav.attr('id');
          store.set('options_active_tab', id);
          if (!initialTabChange) {
            id = id.match(/(\S*)_nav$/)[1];
            id = id[0].toUpperCase() + id.substr(1);
            log.debug("Changing tab to " + id);
            analytics.track('Tabs', 'Changed', id);
          }
          initialTabChange = false;
          return $(document.body).scrollTop(0);
        }
      });
      store.init('options_active_tab', 'general_nav');
      optionsActiveTab = store.get('options_active_tab');
      $("#" + optionsActiveTab).trigger('click');
      log.debug("Initially displaying tab for " + optionsActiveTab);
      $('#tools_nav').on('click', function() {
        return $('#tools_wizard').modal('show');
      });
      $('.tools_close_btn').on('click', function() {
        return $('#tools_wizard').modal('hide');
      });
      $('form:not([target="_blank"])').on('submit', function() {
        return false;
      });
      $('footer a[href*="neocotic.com"]').on('click', function() {
        return analytics.track('Footer', 'Clicked', 'Homepage');
      });
      $('#donation input[name="hosted_button_id"]').val(ext.config.options.payPal);
      $('#donation').on('submit', function() {
        return analytics.track('Footer', 'Clicked', 'Donate');
      });
      load();
      $('[popover]').each(function() {
        var $this, placement, trigger;

        $this = $(this);
        placement = $this.attr('data-placement');
        placement = placement != null ? trimToLower(placement) : 'right';
        trigger = $this.attr('data-trigger');
        trigger = trigger != null ? trimToLower(trigger) : 'hover';
        $this.popover({
          content: function() {
            return i18n.get($this.attr('popover'));
          },
          html: true,
          placement: placement,
          trigger: trigger
        });
        if (trigger === 'manual') {
          return $this.on('click', function() {
            return $this.popover('toggle');
          });
        }
      });
      activateTooltips();
      navHeight = $('.navbar').height();
      return $('[data-goto]').on('click', function() {
        var goto, pos, _ref1;

        goto = $($(this).attr('data-goto'));
        pos = ((_ref1 = goto.position()) != null ? _ref1.top : void 0) || 0;
        if (pos && pos >= navHeight) {
          pos -= navHeight;
        }
        log.debug("Relocating view to include '" + goto.selector + "' at " + pos);
        return $(window).scrollTop(pos);
      });
    };

    Options.prototype.refresh = function() {
      return $("#" + (store.get('options_active_tab'))).trigger('click');
    };

    return Options;

  })(utils.Class));

  utils.ready(function() {
    return options.init();
  });

}).call(this);

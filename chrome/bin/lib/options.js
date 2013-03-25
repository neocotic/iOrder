// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var createError, deriveOrder, ext, isOrderNumberAvailable, load, loadFrequencies, loadNotifications, loadOrder, loadOrderControlEvents, loadOrders, options, save, saveFrequencies, saveNotifications, saveOrders, updateOrder, validateOrder, validateOrders;

  ext = chrome.extension.getBackgroundPage().ext;

  load = function() {
    loadFrequencies();
    loadNotifications();
    loadOrders();
    return loadOrderControlEvents();
  };

  loadFrequencies = function() {
    var freq, frequency, _i, _len, _ref;

    frequency = $('#frequency');
    frequency.remove('option');
    _ref = ext.FREQUENCIES;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      freq = _ref[_i];
      frequency.append($('<option/>', {
        text: freq.text,
        value: freq.value
      }));
    }
    return frequency.find("option[value='" + (utils.get('frequency')) + "']").attr('selected', 'selected');
  };

  loadNotifications = function() {
    var timeInSecs;

    if (utils.get('badges')) {
      $('#badges').attr('checked', 'checked');
    } else {
      $('#badges').removeAttr('checked');
    }
    if (utils.get('notifications')) {
      $('#notifications').attr('checked', 'checked');
    } else {
      $('#notifications').removeAttr('checked');
    }
    timeInSecs = 0;
    if (utils.get('notificationDuration') > timeInSecs) {
      timeInSecs = utils.get('notificationDuration') / 1000;
    }
    return $('#notificationDuration').val(timeInSecs);
  };

  loadOrder = function(order) {
    var opt;

    opt = $('<option/>', {
      text: order.label
    });
    opt.data('code', order.code);
    opt.data('updates', JSON.stringify(order.updates));
    return $('<optgroup/>', {
      label: order.number
    }).append(opt);
  };

  loadOrderControlEvents = function() {
    var lastSelectedOrder, orders, updates;

    lastSelectedOrder = {};
    orders = $('#orders');
    updates = $('#updates');
    orders.change(function() {
      var $this, opt, optGrp, orderUpdate, orderUpdates, _i, _len;

      $this = $(this);
      opt = $this.find('option:selected');
      optGrp = opt.parent('optgroup');
      if (lastSelectedOrder.length) {
        updateOrder(lastSelectedOrder.parent('optgroup'));
      }
      if (opt.length === 0) {
        lastSelectedOrder = {};
        utils.i18nContent('#add_btn', 'opt_add_button');
        $('.read-only, .read-only-always').removeAttr('disabled');
        $('.read-only, .read-only-always').removeAttr('readonly');
        $('#delete_btn').attr('disabled', 'disabled');
        $('#order_code').val('');
        $('#order_label').val('');
        $('#order_number').val('');
        return updates.find('optgroup').remove();
      } else {
        lastSelectedOrder = opt;
        utils.i18nContent('#add_btn', 'opt_add_new_button');
        $('.read-only-always').attr('disabled', 'disabled');
        $('.read-only-always').attr('readonly', 'readonly');
        $('#order_code').val(opt.data('code'));
        $('#order_label').val(opt.text());
        $('#order_number').val(optGrp.attr('label'));
        updates.find('optgroup').remove();
        orderUpdates = JSON.parse(opt.data('updates'));
        for (_i = 0, _len = orderUpdates.length; _i < _len; _i++) {
          orderUpdate = orderUpdates[_i];
          updates.append($('<optgroup/>', {
            label: new Date(orderUpdate.timeStamp).format('d/m/Y @ H:i:s')
          }).append($('<option/>', {
            text: orderUpdate.status
          })));
        }
        $('.read-only').removeAttr('disabled');
        return $('.read-only').removeAttr('readonly');
      }
    }).change();
    $('#add_btn').click(function() {
      var opt, optGrp;

      opt = orders.find('option:selected');
      optGrp = opt.parent('optgroup');
      if (optGrp.length && opt.length) {
        orders.val([]).change();
        return $('#order_label').focus();
      } else {
        $('#errors').find('li').remove();
        optGrp = loadOrder({
          code: $('#order_code').val().trim().toUpperCase(),
          error: '',
          label: $('#order_label').val().trim(),
          number: $('#order_number').val().trim().toUpperCase(),
          trackingUrl: '',
          updates: []
        });
        opt = optGrp.find('option');
        if (validateOrder(optGrp, true)) {
          orders.append(optGrp);
          opt.attr('selected', 'selected');
          return orders.change().focus();
        } else {
          return $.facebox({
            div: '#message'
          });
        }
      }
    });
    $('#delete_btn').click(function() {
      return $.facebox({
        div: '#delete_con'
      });
    });
    $('.delete_no_btn').live('click', function() {
      return $(document).trigger('close.facebox');
    });
    return $('.delete_yes_btn').live('click', function() {
      var optGrp;

      optGrp = orders.find('option:selected').parent('optgroup');
      optGrp.remove();
      orders.change().focus();
      return $(document).trigger('close.facebox');
    });
  };

  loadOrders = function() {
    var order, orders, _i, _len, _ref, _results;

    orders = $('#orders');
    orders.remove('optgroup');
    _ref = ext.orders;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      order = _ref[_i];
      _results.push(orders.append(loadOrder(order)));
    }
    return _results;
  };

  save = function() {
    saveOrders();
    saveNotifications();
    saveFrequencies();
    return utils.sendMessage('extension', {
      type: 'refresh'
    });
  };

  saveFrequencies = function() {
    var frequency;

    frequency = $('#frequency option:selected').val();
    return utils.set('frequency', parseInt(frequency, 10));
  };

  saveNotifications = function() {
    var timeInSecs;

    utils.set('badges', $('#badges').is(':checked'));
    utils.set('notifications', $('#notifications').is(':checked'));
    timeInSecs = $('#notificationDuration').val();
    timeInSecs = timeInSecs != null ? parseInt(timeInSecs, 10) * 1000 : 0;
    return utils.set('notificationDuration', timeInSecs);
  };

  saveOrders = function() {
    var orders;

    orders = [];
    $('#orders optgroup').each(function() {
      return orders.push(deriveOrder($(this)));
    });
    utils.set('orders', orders);
    return ext.orders = orders;
  };

  updateOrder = function(optGrp) {
    var opt;

    opt = optGrp.find('option');
    if (optGrp.length && opt.length) {
      opt.data('code', $('#order_code').val().trim().toUpperCase());
      opt.text($('#order_label').val().trim());
      optGrp.attr('number', $('#order_number').val().trim().toUpperCase());
      return opt;
    }
  };

  isOrderNumberAvailable = function(number) {
    var available;

    available = true;
    $('#orders optgroup').each(function() {
      if ($(this).attr('label') === number) {
        return available = false;
      }
    });
    return available;
  };

  validateOrder = function(optGrp, isNew) {
    var code, errors, label, number, opt;

    opt = optGrp.find('option');
    code = opt.data('code').trim().toUpperCase();
    errors = $('#errors');
    label = opt.text().trim();
    number = optGrp.attr('label').trim().toUpperCase();
    if (label.length === 0) {
      createError('opt_order_label_invalid');
    }
    if (isNew) {
      if (number.length === 0) {
        createError('opt_order_number_invalid');
      } else if (!isOrderNumberAvailable(number)) {
        createError('opt_order_number_unavailable');
      }
    }
    if (code.length === 0) {
      createError('opt_order_code_invalid');
    }
    return errors.find('li').length === 0;
  };

  validateOrders = function() {
    var errors, orders;

    errors = $('#errors');
    orders = $('#orders optgroup');
    errors.remove('li');
    orders.each(function() {
      var $this;

      $this = $(this);
      if (!validateOrder($this)) {
        $this.find('option').attr('selected', 'selected');
        $('#orders').change().focus();
        return false;
      }
    });
    return errors.find('li').length === 0;
  };

  createError = function(name) {
    return $('<li/>', {
      html: utils.i18n(name)
    }).appendTo($('#errors'));
  };

  deriveOrder = function(optGrp) {
    var existingOrder, opt, order;

    opt = optGrp.find('option');
    if (optGrp.length && opt.length) {
      order = {
        code: opt.data('code'),
        error: '',
        label: opt.text(),
        number: optGrp.attr('label'),
        trackingUrl: '',
        updates: []
      };
      existingOrder = ext.getOrder(order.number, order.code);
      if (existingOrder) {
        order.error = existingOrder.error;
        order.trackingUrl = existingOrder.trackingUrl;
        order.updates = existingOrder.updates;
      }
    }
    return order;
  };

  options = window.options = {
    init: function() {
      utils.i18nSetup({
        footer: {
          opt_footer: new Date().format('Y')
        }
      });
      $('[tabify]').click(function() {
        var $this;

        $this = $(this);
        if (!$this.hasClass('selected')) {
          $this.siblings().removeClass('selected');
          $this.addClass('selected');
          $($this.attr('tabify')).show().siblings('.tab').hide();
          return utils.set('options_active_tab', $this.attr('id'));
        }
      });
      utils.init('options_active_tab', 'general_nav');
      $("#" + (utils.get('options_active_tab'))).click();
      $('.save-btn').click(function() {
        updateOrder($('#orders option:selected').parent('optgroup'));
        if (validateOrders()) {
          save();
          return chrome.tabs.getSelected(null, function(tab) {
            return chrome.tabs.remove(tab.id);
          });
        } else {
          return $.facebox({
            div: '#message'
          });
        }
      });
      load();
      return $('a[facebox]').click(function() {
        return $.facebox({
          div: $(this).attr('facebox')
        });
      });
    },
    refresh: function() {
      return $("#" + (utils.get('options_active_tab'))).click();
    }
  };

  utils.ready(function() {
    return options.init();
  });

}).call(this);

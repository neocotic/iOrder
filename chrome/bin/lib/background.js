// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var Extension, HOMEPAGE_DOMAIN, ORDERS_URL, ORDER_URL, STATUS, TRACKER_URL, buildPopup, executeScriptsInExistingTabs, executeScriptsInExistingWindows, ext, getFrequency, getOrderStatusUpdates, getOrderUrl, getStatusText, getStatusUpdates, getWindows, initOrders, init_update, isOrderStatusNew, isValidOrderStatus, markRead, notify, onMessage, selectOrCreateTab, setBadge, updateManager, updateOrder, updatePopup, updates, version, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HOMEPAGE_DOMAIN = 'neocotic.com';

  ORDER_URL = 'https://store.apple.com/us/order/guest/';

  ORDERS_URL = 'https://store.apple.com/us/order/list';

  STATUS = ['We\'ve received your order', 'Processing Items', 'Preparing for Shipment', 'Shipped', 'Complete'];

  TRACKER_URL = 'https://applestore.bridge-point.com/';

  updates = 0;

  version = '';

  buildPopup = function() {
    var errors, footer, footerF, footerL, header, headerF, headerL, order, table, tbody, _i, _len, _ref;

    errors = false;
    footer = $('<footer/>');
    footerF = $('<div/>');
    footerL = $('<div/>');
    header = $('<header/>');
    headerF = $('<div/>');
    headerL = $('<div/>');
    table = $('<table id="orders"/>');
    tbody = $('<tbody/>');
    footer.append(footerF, footerL);
    header.append(headerF, headerL);
    headerL.append($('<a/>', {
      href: '#',
      id: 'optionsLink',
      text: i18n.get('options_text'),
      title: i18n.get('options_title')
    }));
    headerL.append($('<a/>', {
      href: '#',
      id: 'ordersLink',
      text: i18n.get('orders_text'),
      title: i18n.get('orders_title')
    }));
    footerF.append($('<button/>', {
      id: 'refreshLink',
      text: i18n.get('refresh_text'),
      title: i18n.get('refresh_title')
    }));
    if (updateManager.updating) {
      footerF.find('button:first-child').attr({
        disabled: 'disabled',
        title: i18n.get('refreshing_title')
      }).html(i18n.get('refreshing_text'));
    }
    if (updates && store.get('badges')) {
      footerF.append($('<button/>', {
        id: 'clearLink',
        text: i18n.get('clear_text'),
        title: i18n.get('clear_title')
      }));
    }
    footerL.append($('<span/>', {
      text: i18n.get('popup_footer_text', [new Date(store.get('lastUpdated')).format('H:i'), getFrequency().text])
    }));
    $('<thead/>').append($.prototype.append.apply($('<tr/>'), [
      $('<th/>', {
        text: i18n.get('order_header')
      }), $('<th/>', {
        text: i18n.get('status_header')
      }), $('<th/>', {
        text: i18n.get('actions_header')
      })
    ])).appendTo(table);
    table.append(tbody);
    if (!ext.orders.length) {
      $('<tr/>').append($('<td/>', {
        "class": 'empty',
        colspan: 3
      }).html(i18n.get('no_orders_text'))).appendTo(tbody);
      footer.find('#refreshLink').remove();
    }
    _ref = ext.orders;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      order = _ref[_i];
      tbody.append($.prototype.append.apply($('<tr/>'), [
        $.prototype.append.apply($('<td/>'), [
          $('<strong/>', {
            text: order.label
          }), '<br />', $('<a/>', {
            'data-order-code': order.code,
            'data-order-number': order.number,
            href: '#',
            text: order.number,
            title: i18n.get('order_title')
          })
        ]), $('<td/>').append($('<span/>', {
          text: getStatusText(order)
        }))
      ]));
      if (order.error) {
        errors = true;
        tbody.find('tr:last-child td:first-child strong').attr({
          "class": 'error',
          title: i18n.get(order.error)
        });
      }
      if (order.trackingUrl) {
        tbody.find('tr:last-child').append($('<td/>').append($('<a/>', {
          'data-order-code': order.code,
          'data-order-number': order.number,
          href: '#',
          text: i18n.get('track_text'),
          title: i18n.get('track_title')
        })));
      } else {
        tbody.find('tr:last-child').append($('<td/>').append(' '));
      }
    }
    if (errors) {
      $('<img/>', {
        height: 14,
        id: 'errorIcon',
        src: '../images/exclamation_red.png',
        title: i18n.get('update_errors_text'),
        width: 14
      }).prependTo(footerL);
    }
    return ext.popupHtml = $('<div/>').append(header, table, footer).html();
  };

  executeScriptsInExistingTabs = function(tabs) {
    var tab, _i, _len, _results;

    _results = [];
    for (_i = 0, _len = tabs.length; _i < _len; _i++) {
      tab = tabs[_i];
      if (tab.url.indexOf(HOMEPAGE_DOMAIN) !== -1) {
        _results.push(chrome.tabs.executeScript(tab.id, {
          file: 'lib/install.js'
        }));
      }
    }
    return _results;
  };

  executeScriptsInExistingWindows = function() {
    return chrome.windows.getAll(null, function(windows) {
      var win, _i, _len, _results;

      _results = [];
      for (_i = 0, _len = windows.length; _i < _len; _i++) {
        win = windows[_i];
        _results.push(chrome.tabs.query({
          windowId: win.id
        }, executeScriptsInExistingTabs));
      }
      return _results;
    });
  };

  getFrequency = function() {
    var freq, frequency, _i, _len, _ref;

    frequency = store.get('frequency');
    _ref = ext.FREQUENCIES;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      freq = _ref[_i];
      if (freq.value === frequency) {
        return freq;
      }
    }
  };

  getOrderStatusUpdates = function(order, lastRead) {
    var count, update, _i, _len, _ref;

    count = 0;
    _ref = order.updates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      update = _ref[_i];
      if (update.timeStamp > lastRead) {
        count++;
      }
    }
    return count;
  };

  getOrderUrl = function(order) {
    var encode;

    encode = encodeURIComponent;
    return "" + ORDER_URL + (encode(order.number)) + "/" + (encode(order.code));
  };

  getStatusText = function(order) {
    var length, _ref;

    length = (_ref = order.updates) != null ? _ref.length : void 0;
    if (!length) {
      return ' ';
    }
    return order.updates[length - 1].status;
  };

  getStatusUpdates = function() {
    var count, lastRead, order, _i, _len, _ref;

    count = 0;
    lastRead = store.get('lastRead');
    _ref = ext.orders;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      order = _ref[_i];
      count += getOrderStatusUpdates(order, lastRead);
    }
    return count;
  };

  getWindows = function(url) {
    return chrome.extension.getViews({
      type: 'tab'
    }).filter(function(element) {
      return element.location.href.indexOf(url) === 0;
    });
  };

  init_update = function() {
    var freq, frequency, update_progress, _ref;

    update_progress = store.get('update_progress');
    if ((_ref = update_progress.settings) == null) {
      update_progress.settings = [];
    }
    if (update_progress.settings.indexOf('1.1.0') === -1) {
      freq = ext.FREQUENCIES[1].value;
      frequency = store.get('frequency');
      if (frequency > -1 && frequency < freq) {
        store.set('frequency', freq);
      }
      update_progress.settings.push('1.1.0');
      return store.set('update_progress', update_progress);
    }
  };

  initOrders = function() {
    store.init('orders', []);
    return ext.orders = store.get('orders');
  };

  isOrderStatusNew = function(order, status) {
    var update, _i, _len, _ref;

    _ref = order.updates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      update = _ref[_i];
      if (update.status === status) {
        return false;
      }
    }
    return true;
  };

  isValidOrderStatus = function(status) {
    return __indexOf.call(STATUS, status) >= 0;
  };

  markRead = function(retainTimeStamp) {
    updates = 0;
    if (!retainTimeStamp) {
      store.set('lastRead', $.now());
    }
    setBadge();
    return updatePopup();
  };

  notify = function() {
    var oldUpdates;

    oldUpdates = updates;
    updates = getStatusUpdates();
    setBadge(store.get('badges') ? updates || '' : void 0);
    if (updates > oldUpdates && store.get('notifications')) {
      return webkitNotifications.createHTMLNotification(utils.url('pages/notification.html')).show();
    }
  };

  onMessage = function(message, sender, sendResponse) {
    var order, url;

    order = {};
    url = '';
    switch (message.type) {
      case 'clear':
        return markRead();
      case 'options':
        url = utils.url('pages/options.html');
        return selectOrCreateTab(url, function(isNew) {
          var win, _i, _len, _ref, _results;

          if (isNew) {
            return;
          }
          _ref = getWindows(url);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            win = _ref[_i];
            _results.push(win.options.refresh());
          }
          return _results;
        });
      case 'refresh':
        return updateManager.restart();
      case 'track':
        order = ext.getOrder(message.data.number, message.data.code);
        if (order && order.trackingUrl) {
          return chrome.tabs.create({
            url: order.trackingUrl
          });
        }
        break;
      case 'viewAll':
        return chrome.tabs.create({
          url: ORDERS_URL
        });
      case 'view':
        order = ext.getOrder(message.data.number, message.data.code);
        if (order) {
          return chrome.tabs.create({
            url: getOrderUrl(order)
          });
        }
    }
  };

  selectOrCreateTab = function(url, callback) {
    return chrome.windows.getCurrent(function(win) {
      return chrome.tabs.query({
        windowId: win.id
      }, function(tabs) {
        var existingTab, tab, _i, _len;

        for (_i = 0, _len = tabs.length; _i < _len; _i++) {
          tab = tabs[_i];
          if (tab.url.indexOf(url) === 0) {
            existingTab = tab;
            break;
          }
        }
        if (existingTab) {
          chrome.tabs.update(existingTab.id, {
            selected: true
          });
          return typeof callback === "function" ? callback(false) : void 0;
        } else {
          chrome.tabs.create({
            url: url
          });
          return typeof callback === "function" ? callback(true) : void 0;
        }
      });
    });
  };

  setBadge = function(str) {
    if (str == null) {
      str = '';
    }
    return chrome.browserAction.setBadgeText({
      text: String(str)
    });
  };

  updateOrder = function(order, callback) {
    return $.get(getOrderUrl(order), function(data) {
      var heading, status, trackingUrl;

      if (!data) {
        return order.error = 'update_invalid_page_error';
      }
      heading = $(data).find('.order .ship-group .sb-heading');
      status = heading.find('h4 span:first-child');
      trackingUrl = heading.find(".group-actions tr:first-child td a[href^='" + TRACKER_URL + "']");
      status = status.length ? status.text() : '';
      trackingUrl = trackingUrl.length ? trackingUrl.attr('href') : '';
      if (status) {
        if (isValidOrderStatus(status)) {
          if (isOrderStatusNew(order, status)) {
            order.updates.push({
              status: status,
              timeStamp: $.now()
            });
          }
        } else {
          return order.error = 'update_invalid_status_error';
        }
      } else {
        return order.error = 'update_status_not_found_error';
      }
      if (trackingUrl) {
        order.trackingUrl = trackingUrl;
      }
      return order.error = '';
    }).error(function() {
      return order.error = 'update_page_not_found_error';
    }).complete(function() {
      return callback != null ? callback.apply(updateManager, [order]) : void 0;
    });
  };

  updatePopup = function() {
    var _ref;

    buildPopup();
    return (_ref = chrome.extension.getViews({
      type: 'popup'
    })[0]) != null ? _ref.popup.init() : void 0;
  };

  updateManager = {
    id: void 0,
    messages: [],
    updating: false,
    restart: function() {
      var frequency;

      frequency = store.get('frequency');
      if (this.updating) {
        return this.messages.push('restart');
      }
      if (this.id) {
        clearInterval(this.id);
        if (frequency === -1) {
          this.id = void 0;
        }
      }
      if (frequency !== -1) {
        this.id = setInterval(this.run, frequency);
      }
      return this.run();
    },
    run: function() {
      var order, progress, updated, _i, _len, _ref, _results;

      progress = 0;
      this.updating = true;
      notify();
      updatePopup();
      updated = function(order) {
        var message, _i, _len, _ref;

        progress++;
        if (progress >= ext.orders.length) {
          this.updating = false;
          store.set('orders', ext.orders);
          store.set('lastUpdated', $.now());
          notify();
          updatePopup();
          _ref = this.messages;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            message = _ref[_i];
            if (typeof this[message] === "function") {
              this[message]();
            }
          }
          return this.messages = [];
        }
      };
      if (!ext.orders.length) {
        updated.apply(this);
      }
      _ref = ext.orders;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        order = _ref[_i];
        _results.push(updateOrder(order, updated));
      }
      return _results;
    },
    start: function() {
      var frequency;

      frequency = store.get('frequency');
      if (frequency === -1) {
        if (this.id) {
          clearInterval(this.id);
          this.id = void 0;
        }
      } else {
        if (this.id) {
          return;
        }
        this.id = setInterval(this.run, frequency);
      }
      return this.run();
    },
    stop: function() {
      if (this.updating) {
        return this.messages.push('stop');
      }
      if (this.id) {
        clearInterval(this.id);
        return this.id = void 0;
      }
    }
  };

  ext = window.ext = new (Extension = (function(_super) {
    __extends(Extension, _super);

    function Extension() {
      _ref = Extension.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Extension.prototype.FREQUENCIES = [
      {
        text: i18n.get('freq_disabled'),
        value: -1
      }, {
        text: i18n.get('freq_minutes', '15'),
        value: 15 * 60 * 1000
      }, {
        text: i18n.get('freq_minutes', '30'),
        value: 30 * 60 * 1000
      }, {
        text: i18n.get('freq_minutes', '45'),
        value: 45 * 60 * 1000
      }, {
        text: i18n.get('freq_hour'),
        value: 60 * 60 * 1000
      }, {
        text: i18n.get('freq_hours', '2'),
        value: 2 * 60 * 60 * 1000
      }
    ];

    Extension.prototype.orders = [];

    Extension.prototype.popupHtml = '';

    Extension.prototype.getOrder = function(number, code) {
      var order, _i, _len, _ref1;

      _ref1 = ext.orders;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        order = _ref1[_i];
        if (order.number === number && order.code === code) {
          return order;
        }
      }
    };

    Extension.prototype.init = function() {
      store.init('update_progress', {});
      init_update();
      store.init('badges', true);
      store.init('frequency', ext.FREQUENCIES[1].value);
      store.init('lastRead', $.now());
      store.init('lastUpdated', $.now());
      store.init('notifications', true);
      store.init('notificationDuration', 6 * 1000);
      initOrders();
      utils.onMessage('extension', false, onMessage);
      $.getJSON(utils.url('manifest.json'), function(data) {
        version = data.version;
        return executeScriptsInExistingWindows();
      });
      return updateManager.start();
    };

    return Extension;

  })(utils.Class));

  utils.ready(function() {
    return ext.init();
  });

}).call(this);

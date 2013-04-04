// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var EXTENSION_ID, Extension, HOMEPAGE_DOMAIN, REAL_EXTENSION_ID, buildConfig, buildFrequencies, buildPopup, buildStatus, executeScriptsInExistingTabs, executeScriptsInExistingWindows, ext, getFrequency, getOrderStatusUpdates, getStatus, getStatusIndex, getStatusUpdates, getWindows, initOrder, initOrders, initOrders_update, init_update, isNewInstall, isOrderStatusNew, isProductionBuild, markRead, notify, onMessage, selectOrCreateTab, setBadge, updateManager, updateOrder, updatePopup, updates, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EXTENSION_ID = i18n.get('@@extension_id');

  HOMEPAGE_DOMAIN = 'neocotic.com';

  REAL_EXTENSION_ID = 'kflemogpkbophbipihnbcmlplbihbdhb';

  isNewInstall = false;

  isProductionBuild = EXTENSION_ID === REAL_EXTENSION_ID;

  updates = 0;

  buildConfig = function() {
    log.trace();
    buildFrequencies();
    return buildStatus();
  };

  buildFrequencies = function() {
    var hours, i, mins, _i, _len, _ref, _results;

    log.trace();
    _ref = ext.config.frequencies;
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      mins = _ref[i];
      hours = mins / 60;
      _results.push(ext.config.frequencies[i] = mins === -1 ? {
        text: i18n.get('freq_disabled'),
        value: mins
      } : {
        text: (hours < 1 ? i18n.get('freq_minutes', [mins]) : hours === 1 ? i18n.get('freq_hour') : i18n.get('freq_hours', [hours])),
        value: mins * 60 * 1000
      });
    }
    return _results;
  };

  buildPopup = function() {
    var errors, footer, footerF, footerL, header, headerF, headerL, order, table, tbody, _i, _len, _ref;

    log.trace();
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
      text: i18n.get('pop_options_text'),
      title: i18n.get('pop_options_title')
    }));
    headerL.append($('<a/>', {
      href: '#',
      id: 'ordersLink',
      text: i18n.get('pop_orders_text'),
      title: i18n.get('pop_orders_title')
    }));
    footerF.append($('<button/>', {
      id: 'refreshLink',
      text: i18n.get('pop_refresh_button'),
      title: i18n.get('pop_refresh_button_title')
    }));
    if (updateManager.updating) {
      footerF.find('button:first-child').attr({
        disabled: 'disabled',
        title: i18n.get('pop_refresh_button_title_alt')
      }).html(i18n.get('pop_refresh_button_alt'));
    }
    if (updates && store.get('notifications.badges')) {
      footerF.append($('<button/>', {
        id: 'clearLink',
        text: i18n.get('pop_clear_button'),
        title: i18n.get('pop_clear_button_title')
      }));
    }
    footerL.append($('<span/>', {
      text: i18n.get('pop_footer', [new Date(store.get('lastUpdated')).format('H:i'), getFrequency().text])
    }));
    $('<thead/>').append($.prototype.append.apply($('<tr/>'), [
      $('<th/>', {
        text: i18n.get('pop_order_header')
      }), $('<th/>', {
        text: i18n.get('pop_status_header')
      }), $('<th/>', {
        text: i18n.get('pop_actions_header')
      })
    ])).appendTo(table);
    table.append(tbody);
    if (!ext.orders.length) {
      $('<tr/>').append($('<td/>', {
        "class": 'empty',
        colspan: 3
      }).html(i18n.get('empty'))).appendTo(tbody);
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
            title: i18n.get('pop_order_title')
          })
        ]), $('<td/>').append($('<span/>', {
          text: ext.getStatusText(order)
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
          text: i18n.get('pop_track_text'),
          title: i18n.get('pop_track_title')
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
        title: i18n.get('pop_errors_title'),
        width: 14
      }).prependTo(footerL);
    }
    return ext.popupHtml = $('<div/>').append(header, table, footer).html();
  };

  buildStatus = function() {
    var i, status, _i, _len, _ref, _results;

    log.trace();
    _ref = ext.config.apple.status;
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      status = _ref[i];
      _results.push(ext.config.apple.status[i] = {
        text: i18n.get("status_" + i + "_text"),
        value: RegExp("^" + status + "$", "i")
      });
    }
    return _results;
  };

  executeScriptsInExistingTabs = function(tabs) {
    var tab, _i, _len, _results;

    log.trace();
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
    log.trace();
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

    log.trace();
    frequency = store.get('frequency');
    _ref = ext.config.frequencies;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      freq = _ref[_i];
      if (freq.value === frequency) {
        return freq;
      }
    }
  };

  getOrderStatusUpdates = function(order, lastRead) {
    var count, update, _i, _len, _ref;

    log.trace();
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

  getStatus = function(text) {
    log.trace();
    return ext.config.apple.status[getStatusIndex(text)];
  };

  getStatusIndex = function(text) {
    var i, status, _i, _len, _ref;

    log.trace();
    text = text != null ? text.trim() : void 0;
    _ref = ext.config.apple.status;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      status = _ref[i];
      if (status.value.test(text)) {
        return i;
      }
    }
    return -1;
  };

  getStatusUpdates = function() {
    var count, lastRead, order, _i, _len, _ref;

    log.trace();
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
    log.trace();
    return chrome.extension.getViews({
      type: 'tab'
    }).filter(function(element) {
      return element.location.href.indexOf(url) === 0;
    });
  };

  init_update = function() {
    var updater;

    log.trace();
    if (store.exists('update_progress')) {
      store.modify('updates', function(updates) {
        var namespace, progress, versions, _results;

        progress = store.remove('update_progress');
        _results = [];
        for (namespace in progress) {
          if (!__hasProp.call(progress, namespace)) continue;
          versions = progress[namespace];
          _results.push(updates[namespace] = (versions != null ? versions.length : void 0) ? versions.pop() : '');
        }
        return _results;
      });
    }
    updater = new store.Updater('settings');
    isNewInstall = updater.isNew;
    updater.update('1.1.0', function() {
      var freq, frequency;

      log.info('Updating general settings for 1.1.0');
      freq = ext.config.frequencies[1].value;
      frequency = store.get('frequency');
      if (frequency > -1 && frequency < freq) {
        return store.set('frequency', freq);
      }
    });
    return updater.update('1.2.0', function() {
      var notifications, _ref, _ref1;

      log.info('Updating general settings for 1.2.0');
      notifications = store.get('notifications');
      store.set('notifications', {
        badges: (_ref = store.get('badges')) != null ? _ref : true,
        duration: (_ref1 = store.get('notificationDuration')) != null ? _ref1 : 3000,
        enabled: $.type(notifications) === 'boolean' ? notifications : true
      });
      return store.remove('badges', 'notificationDuration');
    });
  };

  initOrder = function(order) {
    var update, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;

    log.trace();
    if ((_ref = order.error) == null) {
      order.error = '';
    }
    if ((_ref1 = order.code) == null) {
      order.code = '';
    }
    if ((_ref2 = order.label) == null) {
      order.label = '';
    }
    if ((_ref3 = order.number) == null) {
      order.number = '';
    }
    if ((_ref4 = order.trackingUrl) == null) {
      order.trackingUrl = '';
    }
    if ((_ref5 = order.updates) == null) {
      order.updates = [];
    }
    _ref6 = order.updates;
    for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
      update = _ref6[_i];
      if ((_ref7 = update.status) == null) {
        update.status = -1;
      }
      if ((_ref8 = update.timeStamp) == null) {
        update.timeStamp = $.now();
      }
    }
    return order;
  };

  initOrders = function() {
    log.trace();
    initOrders_update();
    store.modify('orders', function(orders) {
      var order, _i, _len, _results;

      _results = [];
      for (_i = 0, _len = orders.length; _i < _len; _i++) {
        order = orders[_i];
        _results.push(initOrder(order));
      }
      return _results;
    });
    return ext.updateOrders();
  };

  initOrders_update = function() {
    var updater;

    log.trace();
    updater = new store.Updater('orders');
    return updater.update('1.2.0', function() {
      log.info('Updating order settings for 1.2.0');
      return store.modify('orders', function(orders) {
        var order, update, _i, _len, _ref, _results;

        _results = [];
        for (_i = 0, _len = orders.length; _i < _len; _i++) {
          order = orders[_i];
          if (order.error === 'update_status_not_found_error') {
            order.error = 'update_invalid_status_error';
          }
          if ((_ref = order.key) == null) {
            order.key = utils.keyGen();
          }
          _results.push((function() {
            var _j, _len1, _ref1, _results1;

            _ref1 = order.updates;
            _results1 = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              update = _ref1[_j];
              _results1.push(update.status = getStatusIndex(update.status));
            }
            return _results1;
          })());
        }
        return _results;
      });
    });
  };

  isOrderStatusNew = function(order, status) {
    var update, _i, _len, _ref;

    log.trace();
    _ref = order.updates;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      update = _ref[_i];
      if (update.status === status) {
        return false;
      }
    }
    return true;
  };

  markRead = function(retainTimeStamp) {
    log.trace();
    updates = 0;
    if (!retainTimeStamp) {
      store.set('lastRead', $.now());
    }
    setBadge();
    return updatePopup();
  };

  notify = function() {
    var notifications, oldUpdates;

    log.trace();
    notifications = store.get('notifications');
    oldUpdates = updates;
    updates = getStatusUpdates();
    setBadge(notifications.badges ? updates || '' : void 0);
    if (updates > oldUpdates && notifications.enabled) {
      return webkitNotifications.createHTMLNotification(utils.url('pages/notification.html')).show();
    }
  };

  onMessage = function(message, sender, sendResponse) {
    var getOrder, order, url;

    log.trace();
    order = {};
    url = '';
    getOrder = function(data) {
      var code, number;

      code = data.code, number = data.number;
      return ext.queryOrder(function(order) {
        return order.number === number && order.code === code;
      });
    };
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
      case 'info':
      case 'version':
        return typeof sendResponse === "function" ? sendResponse({
          id: EXTENSION_ID,
          version: ext.version
        }) : void 0;
      case 'refresh':
        return ext.updateOrders();
      case 'track':
        order = getOrder(message.data);
        if (order && order.trackingUrl) {
          return chrome.tabs.create({
            url: order.trackingUrl
          });
        }
        break;
      case 'viewAll':
        return chrome.tabs.create({
          url: ext.config.apple.url.list
        });
      case 'view':
        order = getOrder(message.data);
        if (order) {
          return chrome.tabs.create({
            url: ext.getOrderUrl(order)
          });
        }
    }
  };

  selectOrCreateTab = function(url, callback) {
    log.trace();
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
    log.trace();
    return chrome.browserAction.setBadgeText({
      text: String(str)
    });
  };

  updateOrder = function(order, callback) {
    log.trace();
    return $.get(ext.getOrderUrl(order), function(data) {
      var heading, status, trackingUrl;

      if (!data) {
        return order.error = 'update_invalid_page_error';
      }
      heading = $(data).find('.order .ship-group .sb-heading');
      status = heading.find('h4 span:first-child');
      trackingUrl = heading.find(".group-actions tr:first-child td a[href^='" + ext.config.apple.url.track + "']");
      status = getStatusIndex(status.length ? status.text() : '');
      trackingUrl = trackingUrl.length ? trackingUrl.attr('href') : '';
      if (status >= 0) {
        if (isOrderStatusNew(order, status)) {
          order.updates.push({
            status: status,
            timeStamp: $.now()
          });
        }
      } else {
        return order.error = 'update_invalid_status_error';
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

    log.trace();
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

      log.trace();
      log.info('Restarting update manager');
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
      var order, updated, _i, _len, _ref, _results;

      log.trace();
      log.info('Running update manager');
      this.progress = 0;
      this.updating = true;
      notify();
      updatePopup();
      updated = function(order) {
        var message, _i, _len, _ref;

        log.trace();
        log.debug('Updating order...', order);
        this.progress++;
        if (this.progress >= ext.orders.length) {
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

      log.trace();
      log.info('Starting update manager');
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
      log.trace();
      log.info('Stopping update manager');
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

    Extension.prototype.config = {};

    Extension.prototype.orders = [];

    Extension.prototype.popupHtml = '';

    Extension.prototype.version = '';

    Extension.prototype.init = function() {
      var _this = this;

      log.trace();
      log.info('Initializing extension controller');
      if (store.get('analytics')) {
        analytics.add();
      }
      return $.getJSON(utils.url('manifest.json')).then(function(data) {
        return _this.version = data.version;
      }).then($.getJSON(utils.url('configuration.json')).done(function(data) {
        _this.config = data;
        buildConfig();
        store.init({
          frequency: _this.config.frequencies[1].value,
          lastRead: $.now(),
          lastUpdated: $.now(),
          notifications: {},
          orders: []
        });
        init_update();
        store.modify('notifications', function(notifications) {
          var _ref1, _ref2, _ref3;

          if ((_ref1 = notifications.badges) == null) {
            notifications.badges = true;
          }
          if ((_ref2 = notifications.duration) == null) {
            notifications.duration = 3000;
          }
          return (_ref3 = notifications.enabled) != null ? _ref3 : notifications.enabled = true;
        });
        utils.onMessage('extension', false, onMessage);
        initOrders();
        if (isNewInstall) {
          analytics.track('Installs', 'New', _this.version, Number(isProductionBuild));
        }
        return executeScriptsInExistingWindows();
      }));
    };

    Extension.prototype.getOrderUrl = function(order) {
      var encode;

      log.trace();
      encode = encodeURIComponent;
      return "" + ext.config.apple.url.detail + (encode(order.number)) + "/" + (encode(order.code));
    };

    Extension.prototype.getStatusText = function(order) {
      var index, _ref1, _ref2;

      log.trace();
      index = ((_ref1 = order.updates) != null ? _ref1.length : void 0) ? order.updates.slice(-1).status : -1;
      return (_ref2 = ext.config.apple.status[index]) != null ? _ref2.text : void 0;
    };

    Extension.prototype.queryOrder = function(filter, singular) {
      if (singular == null) {
        singular = true;
      }
      log.trace();
      return utils.query(this.orders, singular, filter);
    };

    Extension.prototype.queryOrders = function(filter) {
      return this.queryOrder(filter, false);
    };

    Extension.prototype.updateOrders = function() {
      log.trace();
      this.orders = store.get('orders');
      this.orders.sort(function(a, b) {
        return a.index - b.index;
      });
      updatePopup();
      return updateManager.restart();
    };

    return Extension;

  })(utils.Class));

  utils.ready(function() {
    return ext.init();
  });

}).call(this);

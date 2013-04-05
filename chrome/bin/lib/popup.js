// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var Popup, addEventHandlers, analytics, ext, i18n, log, openOptions, popup, sendMessage, store, updateStates, utils, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = chrome.extension.getBackgroundPage(), analytics = _ref.analytics, ext = _ref.ext, i18n = _ref.i18n, log = _ref.log, store = _ref.store, utils = _ref.utils;

  addEventHandlers = function(selector, event, handler) {
    var element, elements, _i, _len, _results;

    log.trace();
    elements = document.querySelectorAll(selector);
    _results = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
      element = elements[_i];
      _results.push(element.addEventListener(event, handler));
    }
    return _results;
  };

  openOptions = function() {
    var suffix, tab;

    log.trace();
    suffix = '_nav';
    tab = this.getAttribute('data-options-tab');
    if (tab) {
      if (tab.indexOf(suffix) !== tab.length - suffix.length) {
        tab += suffix;
      }
      store.set('options_active_tab', tab);
    }
    return sendMessage('options', true);
  };

  sendMessage = function(type, closeAfter, data, element) {
    var message;

    if (data == null) {
      data = {};
    }
    log.trace();
    if (element) {
      data.key = element.getAttribute('data-order-key');
    }
    message = {
      data: data,
      type: type
    };
    log.debug('Sending the following message to the extension controller', message);
    utils.sendMessage('extension', message);
    if (closeAfter) {
      return close();
    }
  };

  updateStates = function() {
    var clearButton, errorIndicator, frequency, leftButtonGroup, refreshButton;

    log.trace();
    leftButtonGroup = document.querySelector('.btn-toolbar .btn-group:last-child');
    leftButtonGroup.innerHTML = '';
    if (ext.orders.length) {
      refreshButton = document.createElement('button');
      refreshButton.className = 'btn btn-mini';
      refreshButton.id = 'refreshButton';
      refreshButton.innerHTML = '<i class="icon-refresh"></i>';
      if (ext.isUpdating()) {
        refreshButton.disabled = true;
        refreshButton.setAttribute('title', i18n.get('pop_refresh_button_title_alt'));
      } else {
        refreshButton.setAttribute('title', i18n.get('pop_refresh_button_title'));
      }
      leftButtonGroup.appendChild(refreshButton);
    }
    if (ext.hasUpdates() && store.get('notifications.badges')) {
      clearButton = document.createElement('button');
      clearButton.className = 'btn btn-mini';
      clearButton.id = 'clearButton';
      clearButton.innerHTML = '<i class="icon-trash"></i>';
      clearButton.setAttribute('title', i18n.get('pop_clear_button_title'));
      leftButtonGroup.appendChild(clearButton);
    }
    errorIndicator = document.getElementById('errorIndicator');
    if (ext.hasErrors()) {
      errorIndicator.classList.remove('hide');
    } else {
      errorIndicator.classList.add('hide');
    }
    frequency = document.getElementById('frequency');
    if (store.get('frequency') > 0) {
      return frequency.classList.remove('hide');
    } else {
      return frequency.classList.add('hide');
    }
  };

  popup = window.popup = new (Popup = (function(_super) {
    __extends(Popup, _super);

    function Popup() {
      _ref1 = Popup.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Popup.prototype.init = function() {
      var oldNode, _ref2;

      log.trace();
      if (this.initialized) {
        log.info('Re-initializing the popup');
      } else {
        log.info('Initializing the popup');
        analytics.track('Frames', 'Displayed', 'Popup');
      }
      oldNode = i18n.manager.node;
      i18n.manager.node = document;
      try {
        i18n.init({
          frequency: {
            pop_footer_frequency_text: (_ref2 = ext.getFrequency()) != null ? _ref2.text : void 0
          },
          lastUpdated: {
            pop_footer_last_updated_text: ext.getTimeAgoHtml(store.get('lastUpdated'))
          }
        });
      } finally {
        i18n.manager.node = oldNode;
      }
      updateStates();
      addEventHandlers('#refreshButton', 'click', function() {
        return sendMessage('refresh');
      });
      addEventHandlers('#clearButton', 'click', function() {
        return sendMessage('clear');
      });
      if (!this.initialized) {
        addEventHandlers('#optionsButton', 'click', openOptions);
        addEventHandlers('#ordersButton', 'click', function() {
          return sendMessage('viewAll', true);
        });
      }
      document.querySelector('#orders tbody').innerHTML = ext.ordersHtml;
      addEventHandlers('#noOrdersLink', 'click', openOptions);
      addEventHandlers('#orders a[data-order-action]', 'click', function() {
        return sendMessage(this.getAttribute('data-order-action'), true, null, this);
      });
      this.initialized = true;
      return document.body.classList.remove('hide');
    };

    return Popup;

  })(utils.Class));

  utils.ready(this, function() {
    return popup.init();
  });

}).call(this);

// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var Popup, addEventHandler, ext, popup, sendMessage, store, utils, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = chrome.extension.getBackgroundPage(), ext = _ref.ext, store = _ref.store, utils = _ref.utils;

  addEventHandler = function(selector, event, handler, context) {
    var element, elements, _i, _len, _results;

    if (context == null) {
      context = document;
    }
    elements = context.querySelectorAll(selector);
    _results = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
      element = elements[_i];
      _results.push(element.addEventListener(event, handler));
    }
    return _results;
  };

  sendMessage = function(type, closeAfter, data, element) {
    if (data == null) {
      data = {};
    }
    if (element) {
      data.code = element.getAttribute('data-order-code');
      data.number = element.getAttribute('data-order-number');
    }
    utils.sendMessage('extension', {
      data: data,
      type: type
    });
    if (closeAfter) {
      return window.close();
    }
  };

  popup = window.popup = new (Popup = (function(_super) {
    __extends(Popup, _super);

    function Popup() {
      _ref1 = Popup.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Popup.prototype.clear = function() {
      return sendMessage('clear');
    };

    Popup.prototype.init = function() {
      var orderRow, _i, _len, _ref2, _results;

      document.body.innerHTML = ext.popupHtml;
      addEventHandler('#optionsLink', 'click', popup.options);
      addEventHandler('#ordersLink', 'click', popup.viewAll);
      addEventHandler('#clearLink', 'click', popup.clear);
      addEventHandler('#noOrdersLink', 'click', popup.options);
      addEventHandler('#refreshLink', 'click', popup.refresh);
      _ref2 = document.querySelectorAll('#orders tbody tr');
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        orderRow = _ref2[_i];
        addEventHandler('td:first-child a', 'click', popup.view, orderRow);
        _results.push(addEventHandler('td:last-child a', 'click', popup.track, orderRow));
      }
      return _results;
    };

    Popup.prototype.options = function() {
      var suffix, tab;

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

    Popup.prototype.refresh = function() {
      return sendMessage('refresh');
    };

    Popup.prototype.track = function() {
      return sendMessage('track', true, {}, this);
    };

    Popup.prototype.view = function() {
      return sendMessage('view', true, {}, this);
    };

    Popup.prototype.viewAll = function() {
      return sendMessage('viewAll', true);
    };

    return Popup;

  })(utils.Class));

  utils.ready(this, function() {
    return popup.init();
  });

}).call(this);

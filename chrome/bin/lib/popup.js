// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var addEventHandler, ext, popup, sendMessage;

  ext = chrome.extension.getBackgroundPage().ext;

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

  popup = window.popup = {
    clear: function() {
      return sendMessage('clear');
    },
    init: function() {
      var orderRow, _i, _len, _ref, _results;

      document.body.innerHTML = ext.popupHtml;
      addEventHandler('#optionsLink', 'click', popup.options);
      addEventHandler('#ordersLink', 'click', popup.viewAll);
      addEventHandler('#clearLink', 'click', popup.clear);
      addEventHandler('#noOrdersLink', 'click', popup.options);
      addEventHandler('#refreshLink', 'click', popup.refresh);
      _ref = document.querySelectorAll('#orders tbody tr');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        orderRow = _ref[_i];
        addEventHandler('td:first-child a', 'click', popup.view, orderRow);
        _results.push(addEventHandler('td:last-child a', 'click', popup.track, orderRow));
      }
      return _results;
    },
    options: function() {
      var suffix, tab;

      suffix = '_nav';
      tab = this.getAttribute('data-options-tab');
      if (tab) {
        if (tab.indexOf(suffix) !== tab.length - suffix.length) {
          tab += suffix;
        }
        utils.set('options_active_tab', tab);
      }
      return sendMessage('options', true);
    },
    refresh: function() {
      return sendMessage('refresh');
    },
    track: function() {
      return sendMessage('track', true, {}, this);
    },
    view: function() {
      return sendMessage('view', true, {}, this);
    },
    viewAll: function() {
      return sendMessage('viewAll', true);
    }
  };

  utils.ready(function() {
    return popup.init();
  });

}).call(this);

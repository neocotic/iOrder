// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var i18nAttributes, i18nHandlers, i18nProcess, i18nSelector, i18nSubs, key, utils,
    __slice = [].slice;

  i18nHandlers = {
    'i18n-content': function(element, value, subMap) {
      var subs;

      subs = i18nSubs(element, value, subMap);
      return element.innerHTML = utils.i18n(value, subs);
    },
    'i18n-values': function(element, value, subMap) {
      var obj, part, parts, path, prop, propExpr, propName, subs, _i, _len, _results;

      subs = i18nSubs(element, value, subMap);
      parts = value.replace(/\s/g, '').split(';');
      _results = [];
      for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        prop = part.match(/^([^:]+):(.+)$/);
        if (prop) {
          propName = prop[1];
          propExpr = prop[2];
          if (propName.indexOf('.') === 0) {
            path = propName.slice(1).split('.');
            obj = element;
            while (obj && path.length > 1) {
              obj = obj[path.shift()];
            }
            if (obj) {
              obj[path] = utils.i18n(value, subs);
              if (path === 'innerHTML') {
                _results.push(i18nProcess(element, subMap));
              } else {
                _results.push(void 0);
              }
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(element.setAttribute(propName, utils.i18n(propExpr, subs)));
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  i18nAttributes = [];

  for (key in i18nHandlers) {
    i18nAttributes.push(key);
  }

  i18nSelector = "[" + (i18nAttributes.join('],[')) + "]";

  i18nProcess = function(node, subMap) {
    var attribute, element, name, _i, _len, _ref, _results;

    _ref = node.querySelectorAll(i18nSelector);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      _results.push((function() {
        var _j, _len1, _results1;

        _results1 = [];
        for (_j = 0, _len1 = i18nAttributes.length; _j < _len1; _j++) {
          name = i18nAttributes[_j];
          attribute = element.getAttribute(name);
          if (attribute != null) {
            _results1.push(i18nHandlers[name](element, attribute, subMap));
          } else {
            _results1.push(void 0);
          }
        }
        return _results1;
      })());
    }
    return _results;
  };

  i18nSubs = function(element, value, subMap) {
    var prop, subProp, subs;

    if (subMap) {
      for (prop in subMap) {
        if (!(subMap.hasOwnProperty(prop) && prop === element.id)) {
          continue;
        }
        for (subProp in subMap[prop]) {
          if (subMap[prop].hasOwnProperty(subProp)) {
            if (subProp === value) {
              subs = subMap[prop][subProp];
              break;
            }
          }
        }
        break;
      }
    }
    return subs;
  };

  utils = window.utils = {
    onMessage: function() {
      var args, base, external, type;

      type = arguments[0], external = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (type == null) {
        type = 'extension';
      }
      base = chrome[type];
      if (!base && type === 'runtime') {
        base = chrome.extension;
      }
      if (external) {
        base = base.onMessageExternal || base.onRequestExternal;
      } else {
        base = base.onMessage || base.onRequest;
      }
      return base.addListener.apply(base, args);
    },
    ready: function(context, handler) {
      if (handler == null) {
        handler = context;
        context = window;
      }
      if (context.jQuery != null) {
        return context.jQuery(handler);
      } else {
        return context.document.addEventListener('DOMContentLoaded', handler);
      }
    },
    sendMessage: function() {
      var args, base, type;

      type = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (type == null) {
        type = 'extension';
      }
      base = chrome[type];
      if (!base && type === 'runtime') {
        base = chrome.extension;
      }
      return (base.sendMessage || base.sendRequest).apply(base, args);
    },
    url: function() {
      var _ref;

      return (_ref = chrome.extension).getURL.apply(_ref, arguments);
    },
    exists: function(key) {
      return localStorage.hasOwnProperty(key);
    },
    get: function(key) {
      var value;

      value = localStorage[key];
      if (value != null) {
        return JSON.parse(value);
      } else {
        return value;
      }
    },
    init: function(key, defaultValue) {
      var value;

      value = utils.get(key);
      return utils.set(key, value != null ? value : defaultValue);
    },
    remove: function(key) {
      var exists;

      exists = utils.exists(key);
      delete localStorage[key];
      return exists;
    },
    rename: function(oldKey, newKey, defaultValue) {
      if (utils.exists(oldKey)) {
        utils.init(newKey, utils.get(oldKey));
        return utils.remove(oldKey);
      } else {
        return utils.init(newKey, defaultValue);
      }
    },
    set: function(key, value) {
      var oldValue;

      oldValue = utils.get(key);
      localStorage[key] = value != null ? JSON.stringify(value) : value;
      return oldValue;
    },
    i18n: function() {
      return chrome.i18n.getMessage.apply(chrome.i18n, arguments);
    },
    i18nAttribute: function(selector, attribute, value, subs) {
      var element, elements, _i, _len, _results;

      elements = document.querySelectorAll(selector);
      if (typeof subs === 'string') {
        subs = [subs];
      }
      _results = [];
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        element = elements[_i];
        _results.push(element.setAttribute(attribute, utils.i18n(value, subs)));
      }
      return _results;
    },
    i18nContent: function(selector, value, subs) {
      var element, elements, _i, _len, _results;

      elements = document.querySelectorAll(selector);
      if (typeof subs === 'string') {
        subs = [subs];
      }
      _results = [];
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        element = elements[_i];
        _results.push(element.innerHTML = utils.i18n(value, subs));
      }
      return _results;
    },
    i18nSetup: function(subMap) {
      return i18nProcess(document, subMap);
    }
  };

}).call(this);

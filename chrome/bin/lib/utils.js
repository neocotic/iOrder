// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var Class, Utils, timings, typeMap, utils, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Class = (function() {
    function Class() {}

    Class.prototype.toString = function() {
      return this.constructor.name;
    };

    return Class;

  })();

  timings = {};

  typeMap = {};

  ['Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Object'].forEach(function(name) {
    return typeMap["[object " + name + "]"] = name.toLowerCase();
  });

  utils = window.utils = new (Utils = (function(_super) {
    __extends(Utils, _super);

    function Utils() {
      _ref = Utils.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Utils.prototype.clone = function(obj, deep) {
      var copy, key, value;

      if (!this.isObject(obj)) {
        return obj;
      }
      if (this.isArray(obj)) {
        return obj.slice();
      }
      copy = {};
      for (key in obj) {
        if (!__hasProp.call(obj, key)) continue;
        value = obj[key];
        copy[key] = deep ? this.clone(value, true) : value;
      }
      return copy;
    };

    Utils.prototype.isArray = Array.isArray || function(obj) {
      return 'array' === this.type(obj);
    };

    Utils.prototype.isObject = function(obj) {
      return obj === Object(obj);
    };

    Utils.prototype.keyGen = function(separator, length, prefix, upperCase) {
      var i, key, max, min, part, parts, _i, _len;

      if (separator == null) {
        separator = '.';
      }
      if (length == null) {
        length = 5;
      }
      if (prefix == null) {
        prefix = '';
      }
      if (upperCase == null) {
        upperCase = true;
      }
      parts = [];
      parts.push(new Date().getTime());
      if (length > 0) {
        min = this.repeat('1', '0', length === 1 ? 1 : length - 1);
        max = this.repeat('f', 'f', length === 1 ? 1 : length - 1);
        min = parseInt(min, 16);
        max = parseInt(max, 16);
        parts.push(this.random(min, max));
      }
      for (i = _i = 0, _len = parts.length; _i < _len; i = ++_i) {
        part = parts[i];
        parts[i] = part.toString(16);
      }
      key = prefix + parts.join(separator);
      if (upperCase) {
        return key.toUpperCase();
      } else {
        return key.toLowerCase();
      }
    };

    Utils.prototype.onMessage = function() {
      var args, base, external, type;

      type = arguments[0], external = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (type == null) {
        type = 'extension';
      }
      base = chrome[type];
      if (!base && type === 'runtime') {
        base = chrome.extension;
      }
      base = external ? base.onMessageExternal || base.onRequestExternal : base.onMessage || base.onRequest;
      return base.addListener.apply(base, args);
    };

    Utils.prototype.query = function(entities, singular, filter) {
      var entity, _i, _j, _len, _len1, _results;

      if (singular) {
        for (_i = 0, _len = entities.length; _i < _len; _i++) {
          entity = entities[_i];
          if (filter(entity)) {
            return entity;
          }
        }
      } else {
        _results = [];
        for (_j = 0, _len1 = entities.length; _j < _len1; _j++) {
          entity = entities[_j];
          if (filter(entity)) {
            _results.push(entity);
          }
        }
        return _results;
      }
    };

    Utils.prototype.random = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    Utils.prototype.ready = function(context, handler) {
      if (handler == null) {
        handler = context;
        context = window;
      }
      if (context.jQuery != null) {
        return context.jQuery(handler);
      } else {
        return context.document.addEventListener('DOMContentLoaded', handler);
      }
    };

    Utils.prototype.repeat = function(str, repeatStr, count) {
      var i, _i, _j, _ref1;

      if (str == null) {
        str = '';
      }
      if (repeatStr == null) {
        repeatStr = str;
      }
      if (count == null) {
        count = 1;
      }
      if (count !== 0) {
        if (count > 0) {
          for (i = _i = 1; 1 <= count ? _i <= count : _i >= count; i = 1 <= count ? ++_i : --_i) {
            str += repeatStr;
          }
        }
        if (count < 0) {
          for (i = _j = 1, _ref1 = count * -1; 1 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 1 <= _ref1 ? ++_j : --_j) {
            str = repeatStr + str;
          }
        }
      }
      return str;
    };

    Utils.prototype.sendMessage = function() {
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
    };

    Utils.prototype.time = function(key) {
      if (timings.hasOwnProperty(key)) {
        return new Date().getTime() - timings[key];
      } else {
        return timings[key] = new Date().getTime();
      }
    };

    Utils.prototype.timeEnd = function(key) {
      var start;

      if (timings.hasOwnProperty(key)) {
        start = timings[key];
        delete timings[key];
        return new Date().getTime() - start;
      } else {
        return 0;
      }
    };

    Utils.prototype.type = function(obj) {
      if (obj != null) {
        return typeMap[Object.prototype.toString.call(obj)] || 'object';
      } else {
        return String(obj);
      }
    };

    Utils.prototype.url = function() {
      var _ref1;

      return (_ref1 = chrome.extension).getURL.apply(_ref1, arguments);
    };

    return Utils;

  })(Class));

  utils.Class = Class;

}).call(this);

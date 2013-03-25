// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var LEVELS, Log, console, log, loggable, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  LEVELS = {
    trace: 10,
    information: 20,
    debug: 30,
    warning: 40,
    error: 50
  };

  console = chrome.extension.getBackgroundPage().console;

  loggable = function(level) {
    return log.config.enabled && level >= log.config.level;
  };

  log = window.log = new (Log = (function(_super) {
    var array, key, value;

    __extends(Log, _super);

    function Log() {
      _ref = Log.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Log.prototype.TRACE = LEVELS.trace;

    Log.prototype.INFORMATION = LEVELS.information;

    Log.prototype.DEBUG = LEVELS.debug;

    Log.prototype.WARNING = LEVELS.warning;

    Log.prototype.ERROR = LEVELS.error;

    Log.prototype.LEVELS = ((function() {
      array = [];
      for (key in LEVELS) {
        if (!__hasProp.call(LEVELS, key)) continue;
        value = LEVELS[key];
        array.push({
          name: key,
          value: value
        });
      }
      return array.sort(function(a, b) {
        return a.value - b.value;
      });
    })());

    Log.prototype.config = {
      enabled: false,
      level: LEVELS.debug
    };

    Log.prototype.count = function() {
      var name, names, _i, _len, _results;

      names = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (loggable(this.DEBUG)) {
        _results = [];
        for (_i = 0, _len = names.length; _i < _len; _i++) {
          name = names[_i];
          _results.push(console.count(name));
        }
        return _results;
      }
    };

    Log.prototype.debug = function() {
      var entries, entry, _i, _len, _results;

      entries = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (loggable(this.DEBUG)) {
        _results = [];
        for (_i = 0, _len = entries.length; _i < _len; _i++) {
          entry = entries[_i];
          _results.push(console.debug(entry));
        }
        return _results;
      }
    };

    Log.prototype.dir = function() {
      var entries, entry, _i, _len, _results;

      entries = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (loggable(this.DEBUG)) {
        _results = [];
        for (_i = 0, _len = entries.length; _i < _len; _i++) {
          entry = entries[_i];
          _results.push(console.dir(entry));
        }
        return _results;
      }
    };

    Log.prototype.error = function() {
      var entries, entry, _i, _len, _results;

      entries = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (loggable(this.ERROR)) {
        _results = [];
        for (_i = 0, _len = entries.length; _i < _len; _i++) {
          entry = entries[_i];
          _results.push(console.error(entry));
        }
        return _results;
      }
    };

    Log.prototype.info = function() {
      var entries, entry, _i, _len, _results;

      entries = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (loggable(this.INFORMATION)) {
        _results = [];
        for (_i = 0, _len = entries.length; _i < _len; _i++) {
          entry = entries[_i];
          _results.push(console.info(entry));
        }
        return _results;
      }
    };

    Log.prototype.out = function() {
      var entries, entry, _i, _len, _results;

      entries = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.config.enabled) {
        _results = [];
        for (_i = 0, _len = entries.length; _i < _len; _i++) {
          entry = entries[_i];
          _results.push(console.log(entry));
        }
        return _results;
      }
    };

    Log.prototype.time = function() {
      var name, names, _i, _len, _results;

      names = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (loggable(this.DEBUG)) {
        _results = [];
        for (_i = 0, _len = names.length; _i < _len; _i++) {
          name = names[_i];
          _results.push(console.time(name));
        }
        return _results;
      }
    };

    Log.prototype.timeEnd = function() {
      var name, names, _i, _len, _results;

      names = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (loggable(this.DEBUG)) {
        _results = [];
        for (_i = 0, _len = names.length; _i < _len; _i++) {
          name = names[_i];
          _results.push(console.timeEnd(name));
        }
        return _results;
      }
    };

    Log.prototype.trace = function(caller) {
      if (caller == null) {
        caller = this.trace;
      }
      if (loggable(this.TRACE)) {
        return console.log(new this.StackTrace(caller).stack);
      }
    };

    Log.prototype.warn = function() {
      var entries, entry, _i, _len, _results;

      entries = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (loggable(this.WARNING)) {
        _results = [];
        for (_i = 0, _len = entries.length; _i < _len; _i++) {
          entry = entries[_i];
          _results.push(console.warn(entry));
        }
        return _results;
      }
    };

    return Log;

  })(utils.Class));

  log.StackTrace = (function(_super) {
    __extends(StackTrace, _super);

    function StackTrace(caller) {
      if (caller == null) {
        caller = log.StackTrace;
      }
      Error.captureStackTrace(this, caller);
    }

    return StackTrace;

  })(utils.Class);

  if (typeof store !== "undefined" && store !== null) {
    store.init('logger', {});
    store.modify('logger', function(logger) {
      var _ref1, _ref2;

      if ((_ref1 = logger.enabled) == null) {
        logger.enabled = false;
      }
      if ((_ref2 = logger.level) == null) {
        logger.level = LEVELS.debug;
      }
      return log.config = logger;
    });
  }

}).call(this);

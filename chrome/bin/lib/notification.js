// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var Notification, analytics, i18n, log, notification, store, utils, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = chrome.extension.getBackgroundPage(), analytics = _ref.analytics, i18n = _ref.i18n, log = _ref.log, store = _ref.store, utils = _ref.utils;

  notification = window.notification = new (Notification = (function(_super) {
    __extends(Notification, _super);

    function Notification() {
      _ref1 = Notification.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Notification.prototype.init = function() {
      var duration;

      log.trace();
      log.info('Initializing a notification');
      analytics.track('Frames', 'Displayed', 'Notification');
      i18n.init();
      duration = store.get('notifications.duration');
      if (duration > 0) {
        return setTimeout((function() {
          return close();
        }), duration);
      }
    };

    return Notification;

  })(utils.Class));

  utils.ready(this, function() {
    return notification.init();
  });

}).call(this);

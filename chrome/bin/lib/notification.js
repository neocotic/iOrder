// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var notification;

  notification = window.notification = {
    init: function() {
      var duration;

      utils.i18nSetup();
      duration = utils.get('notificationDuration');
      if (duration > 0) {
        return window.setTimeout(function() {
          return window.close();
        }, duration);
      }
    }
  };

  utils.ready(function() {
    return notification.init();
  });

}).call(this);

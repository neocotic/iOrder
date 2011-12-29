// [iOrder](http://neocotic.com/iOrder)  
// (c) 2011 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/iOrder>

(function (window, undefined) {

  // Private variables
  // -----------------

  // Easily accessible reference to the extension controller.
  var ext = chrome.extension.getBackgroundPage().ext;

  // Notification page setup
  // -----------------------

  var notification = window.notification = {

    // Public functions
    // ----------------

    // Initialize the notification page.
    init: function () {
      utils.i18nSetup();
      var duration = utils.get('notificationDuration');
      // Set a timer to close the notification after a specified period of
      // time, if user enabled the corresponding option; otherwise it should
      // stay open until it is closed manually by user.
      if (duration > 0) {
        window.setTimeout(function () {
          window.close();
        }, duration);
      }
    }

  };

}(this));
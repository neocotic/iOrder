// [iOrder](http://neocotic.com/iOrder)  
// (c) 2012 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/iOrder>

(function (window, undefined) {

  // Private variables
  // -----------------

  // Easily accessible reference to the extension controller.
  var ext = chrome.extension.getBackgroundPage().ext;

  // Private functions
  // -----------------

  // Send a request to the background page using the information provided.
  function sendRequest(type, closeAfter, data, element) {
    data = data || {};
    // Extract the related order data from the element, where possible.
    if (element) {
      data.code = element.getAttribute('data-order-code');
      data.number = element.getAttribute('data-order-number');
    }
    // Send the request to the background page.
    chrome.extension.sendRequest({data: data, type: type});
    // Close this pesky popup.
    if (closeAfter) window.close();
  }

  // Popup page setup
  // ----------------

  var popup = window.popup = {

    // Public functions
    // ----------------

    // Send a request to clear any badge being displayed.
    clear: function () {
      sendRequest('clear');
    },

    // Initialize the popup page.
    init: function () {
      // Insert the prepared HTML in to the popup's body.
      document.body.innerHTML = ext.popupHtml;
    },

    // Send a request to open the Orders tab on the options page.
    options: function (tab) {
      var suffix = '_nav';
      if (tab) {
        if (tab.indexOf(suffix) !== tab.length - suffix.length) tab += suffix;
        utils.set('options_active_tab', tab);
      }
      sendRequest('options', true);
    },

    // Send a request to update the orders immediately.
    refresh: function () {
      sendRequest('refresh');
    },

    // Send a request to open the tracking page for the order relating to the
    // clicked link.
    track: function (element) {
      sendRequest('track', true, {}, element);
    },

    // Send a request to open the page on the Apple US store for the order
    // relating to the clicked link.
    view: function (element) {
      sendRequest('view', true, {}, element);
    },

    // Send a request to open the order listing page on the Apple US store.
    viewAll: function () {
      sendRequest('viewAll', true);
    }

  };

}(this));
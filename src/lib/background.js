// [iOrder](http://neocotic.com/iOrder)  
// (c) 2012 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/iOrder>

(function (window, undefined) {

  // Private constants
  // -----------------

  var
    // Domain of this extension's homepage.
    HOMEPAGE_DOMAIN = 'neocotic.com',
    // Base URL (incl. domain and path) of order pages on the Apple US store.  
    // The remaining path segments include the number and delivery zip/post
    // code, in that order.
    ORDER_URL       = 'https://store.apple.com/us/order/guest/',
    // URL of the Apple US store orders list for an account.
    ORDERS_URL      = 'https://store.apple.com/us/order/list',
    // List of recognised order status used by the Apple US store.
    STATUS          = [
                        'We\'ve received your order',
                        'Processing Items',
                        'Preparing for Shipment',
                        'Shipped',
                        'Complete'
                      ],
    // Base URL (incl. domain) of the track link on the Apple US store order
    // page.  
    // This should be used to find and extract the track URL for a specific
    // order.
    TRACKER_URL     = 'https://applestore.bridge-point.com/';

  // Private variables
  // -----------------

  var
    // Number of status updates since the user last cleared it.
    updates = 0,
    // Current version of iOrder.
    version = '';

  // Private functions
  // -----------------

  // Build the HTML to populate the popup with to optimize popup loading times.
  function buildPopup() {
    var
      errors = false,
      footer = $('<footer/>').append($('<div/>'), $('<div/>')),
      header = $('<header/>').append($('<div/>'), $('<div/>')),
      table  = $('<table id="orders"/>'),
      tbody  = $('<tbody/>');
    // Add the header links (Options, Orders).
    header.find('div:last-child').append(
      $('<a/>', {
        href    : '#',
        id      : 'optionsLink',
        onclick : 'popup.options()',
        text    : utils.i18n('options_text'),
        title   : utils.i18n('options_title')
      }), $('<a/>', {
        href    : '#',
        id      : 'ordersLink',
        onclick : 'popup.viewAll()',
        text    : utils.i18n('orders_text'),
        title   : utils.i18n('orders_title')
      })
    );
    // Add the refresh button to the footer (can be removed though).
    footer.find('div:first-child').append(
      $('<button/>', {
        id      : 'refreshLink',
        onclick : 'popup.refresh()',
        text    : utils.i18n('refresh_text'),
        title   : utils.i18n('refresh_title')
      })
    );
    // Change the refresh button to show I'm busy... I am you know.
    if (updateManager.updating) {
      footer.find('div:first-child button:first-child').attr({
        disabled : 'disabled',
        title    : utils.i18n('refreshing_title')
      }).html(utils.i18n('refreshing_text'));
    }
    // Add the clear button if badges are visibile; they can be distracting.
    if (updates) {
      footer.find('div:first-child').append(
        $('<button/>', {
          id      : 'clearLink',
          onclick : 'popup.clear()',
          text    : utils.i18n('clear_text'),
          title   : utils.i18n('clear_title')
        })
      );
    }
    // Add the update details to the footer.
    footer.find('div:last-child').append(
      $('<span/>', {
        text: utils.i18n('popup_footer_text', [
          new Date(utils.get('lastUpdated')).format('H:i'),
          getFrequency().text
        ])
      })
    );
    // Add the column headers to the orders table.
    table.append(
      $('<thead/>').append(
        $('<tr/>').append(
          $('<th/>', {text: utils.i18n('order_header')}),
          $('<th/>', {text: utils.i18n('status_header')}),
          $('<th/>', {text: utils.i18n('actions_header')})
        )
      )
    );
    // Add the table body which will contain the orders.
    table.append(tbody);
    // No orders exist so fill the blank and hide the refresh link.
    if (!ext.orders.length) {
      $('<tr/>').append(
        $('<td/>', {
          'class': 'empty',
          colspan: 3
        }).append(utils.i18n('no_orders_text'))
      ).appendTo(tbody);
      footer.find('#refreshLink').remove();
    }
    // Otherwise; let's create a row for each order.
    for (var i = 0; i < ext.orders.length; i++) {
      $('<tr/>').append(
        $('<td/>').append(
          $('<strong/>', {text: ext.orders[i].label}),
          '<br />',
          $('<a/>', {
            'data-order-code'   : ext.orders[i].code,
            'data-order-number' : ext.orders[i].number,
            href                : '#',
            onclick             : 'popup.view(this)',
            text                : ext.orders[i].number,
            title               : utils.i18n('order_title')
          })
        ),
        $('<td/>').append($('<span/>', {text: getStatusText(i)}))
      ).appendTo(tbody);
      // Order had an error; I suppose I should tell the user.
      if (ext.orders[i].error) {
        errors = true;
        tbody.find('tr:last-child td:first-child strong').attr({
          'class' : 'error',
          title   : utils.i18n(ext.orders[i].error)
        });
      }
      // Found the track link so I'll share it with the user.
      if (ext.orders[i].trackingUrl) {
        tbody.find('tr:last-child').append(
          $('<td/>').append(
            $('<a/>', {
              'data-order-code'   : ext.orders[i].code,
              'data-order-number' : ext.orders[i].number,
              href                : '#',
              onclick             : 'popup.track(this)',
              text                : utils.i18n('track_text'),
              title               : utils.i18n('track_title')
            })
          )
        );
      } else {
        tbody.find('tr:last-child').append($('<td/>').append(' '));
      }
    }
    // One or more order has an error so I'll add a little icon.
    if (errors) {
      footer.find('div:last-child').prepend(
        $('<img/>', {
          height : 14,
          id     : 'errorIcon',
          src    : '../images/exclamation_red.png',
          title  : utils.i18n('update_errors_text'),
          width  : 14
        })
      );
    }
    ext.popupHtml = $('<div/>').append(header, table, footer).html();
  }

  // Inject and execute the `install.js` script within each of the tabs
  // provided (where valid).
  function executeScriptsInExistingTabs(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].url.indexOf(HOMEPAGE_DOMAIN) !== -1) {
        chrome.tabs.executeScript(tabs[i].id, {file: 'lib/install.js'});
      }
    }
  }

  // Inject and execute the `install.js` script within all the tabs (where
  // valid) of each Chrome window.
  function executeScriptsInExistingWindows() {
    chrome.windows.getAll(null, function (windows) {
      for (var i = 0; i < windows.length; i++) {
        chrome.tabs.query({windowId: windows[i].id},
            executeScriptsInExistingTabs);
      }
    });
  }

  // Attempt to retrieve the details for the persisted update frequency.
  function getFrequency() {
    var frequency = utils.get('frequency');
    for (var i = 0; i < ext.FREQUENCIES.length; i++) {
      if (ext.FREQUENCIES[i].value === frequency) return ext.FREQUENCIES[i];
    }
  }

  // Return the number of status updates detected by this extension for an
  // order since the specified time.
  function getOrderStatusUpdates(order, lastRead) {
    var count = 0;
    for (var i = 0; i < order.updates.length; i++) {
      if (order.updates[i].timeStamp > lastRead) count++;
    }
    return count;
  }

  // Return the URL of the page on the Apple US store for the specified order.
  function getOrderUrl(order) {
    return ORDER_URL + encodeURIComponent(order.number) + '/' +
        encodeURIComponent(order.code);
  }

  // Attempt to derive the status text to be displayed for the indexed
  // order.  
  // The status text will either be that of the latest update or a single
  // whitespace character if no status updates have been detected yet for
  // that order.
  function getStatusText(index) {
    var length = ext.orders[index].updates.length;
    if (length === 0) return ' ';
    return ext.orders[index].updates[length - 1].status;
  }

  // Return the total number of detected status updates for all existing orders
  // since the last time badges were cleared.
  function getStatusUpdates() {
    var
      count    = 0,
      lastRead = utils.get('lastRead');
    for (var i = 0; i < ext.orders.length; i++) {
      count += getOrderStatusUpdates(ext.orders[i], lastRead);
    }
    return count;
  }

  // Return all windows managed by this extension that are displaying a page
  // that begins with the specified URL.
  function getWindows(url) {
    return chrome.extension.getViews({type: 'tab'}).filter(function (element) {
      return element.location.href.indexOf(url) === 0;
    });
  }

  // Handle the conversion/removal of older version of settings that may have
  // been stored previously by `ext.init`.
  function init_update() {
    var update = utils.get('update_progress');
    update.settings = update.settings || {};
    // Check if the settings need updated for 1.1.0.
    if (update.settings.indexOf('1.1.0') === -1) {
      // Update the settings for 1.1.0.
      var
        defaultFrequency = ext.FREQUENCIES[1].value,
        frequency        = utils.get('frequency');
      if (frequency > -1 && frequency < defaultFrequency) {
        utils.set('frequency', defaultFrequency);
      }
      // Ensure that settings are not updated for 1.1.0 again.
      update.settings.push('1.1.0');
      utils.set('update_progress', update);
    }
  }

  // Initialize the persisted managed orders.
  function initOrders() {
    utils.init('orders', []);
    ext.orders = utils.get('orders');
  }

  // Determine whether or not an order already has the specified status.
  function isOrderStatusNew(order, status) {
    for (var i = 0; i < order.updates.length; i++) {
      if (order.updates[i].status === status) return false;
    }
    return true;
  }

  // Determine whether or not the specified status is recognised by iOrder.
  function isValidOrderStatus(status) {
    for (var i = 0; i < STATUS.length; i++) {
      if (STATUS[i] === status) return true;
    }
    return false;
  }

  // Ensure any badge notification is cleared.
  function markRead(retainTimeStamp) {
    updates = 0;
    if (!retainTimeStamp) utils.set('lastRead', $.now());
    setBadge();
    // Update the UI so the clear button vanishes.
    updatePopup();
  }

  // Attempt to notify the user of any unread status updates.  
  // If there are no status updates, remove any visible badge.
  function notify() {
    var oldUpdates = updates;
    updates = getStatusUpdates();
    // Update/clear badge depending on setting and updates available.
    if (utils.get('badges')) {
      setBadge(updates || '');
    } else {
      setBadge();
    }
    // Show the notification if setting enabled and has new updates.
    if (utils.get('notifications') && updates > oldUpdates) {
      webkitNotifications.createHTMLNotification(
        chrome.extension.getURL('pages/notification.html')
      ).show();
    }
  }

  // Listener for internal requests to the extension.  
  // This function will handle the request based on its type and the data
  // provided.
  function onRequest(request, sender, sendResponse) {
    var order = {}, url = '', windows = [];
    // Check what needs to be done... and then do it.
    switch (request.type) {
    case 'clear':
      markRead();
      break;
    case 'options':
      // Try using existing tabs for the options page before creating one.
      url = chrome.extension.getURL('pages/options.html');
      selectOrCreateTab(url, function (isNew) {
        if (isNew) return;
        windows = getWindows(url);
        for (var i = 0; i < windows.length; i++) windows[i].options.refresh();
      });
      break;
    case 'refresh':
      updateManager.restart();
      break;
    case 'track':
      order = ext.getOrder(request.data.number, request.data.code);
      if (order && order.trackingUrl) {
        chrome.tabs.create({url: order.trackingUrl});
      }
      break;
    case 'viewAll':
      chrome.tabs.create({url: ORDERS_URL});
      break;
    case 'view':
      order = ext.getOrder(request.data.number, request.data.code);
      if (order) chrome.tabs.create({url: getOrderUrl(order)});
      break;
    }
  }

  // Attempt to select a tab in the current window displaying a page whose
  // location begins with the specified URL.  
  // If no existing tab exists a new one is simply created.
  function selectOrCreateTab(url, callback) {
    chrome.windows.getCurrent(function (win) {
      chrome.tabs.query({
        active: true,
        windowId: win.id
      }, function (tabs) {
        var tab;
        // Try to find an existing tab.
        for (var i = 0; i < tabs.length; i++) {
          if (tabs[i].url.indexOf(url) === 0) {
            tab = tabs[i];
            break;
          }
        }
        if (tab) {
          // Found one! Now to select it.
          chrome.tabs.update(tab.id, {selected: true});
          if (callback) callback(false);
        } else {
          // Ach well, let's just create a new one.
          chrome.tabs.create({url: url});
          if (callback) callback(true);
        }
      });
    });
  }

  // Set the badge text to the specified string.  
  // If no string is specified the badge is cleared.
  function setBadge(str) {
    if (str === undefined) str = '';
    chrome.browserAction.setBadgeText({text: String(str)});
  }

  // Send an AJAX request to the specified order's page on the Apple US store
  // and parses the response to update the order's properties.  
  // If an *error* occurs during the update process assign a short description
  // to `order.error`.
  function updateOrder(order, callback) {
    $.get(getOrderUrl(order), function (data) {
      // Probably won't happen; more of a sanity check.
      if (!data) {
        order.error = 'update_invalid_page_error';
        return;
      }
      // Extract the relevant elements wrapped in jQuery goodness.
      var
        heading     = $(data).find('.order .delivery-group .sb-heading'),
        status      = heading.find('h4 span:first-child'),
        trackingUrl = heading.find('.group-actions tr:first-child ' +
            'td a[href^="' + TRACKER_URL + '"]');
      // Dig deeper and try and get the actual values.
      status      = (status.length) ? status.text() : '';
      trackingUrl = (trackingUrl.length) ? trackingUrl.attr('href') : '';
      if (status) {
        // A possible status was found but is it valid?
        if (isValidOrderStatus(status)) {
          // OK, it was valid; but is it new???
          if (isOrderStatusNew(order, status)) {
            // Right! It was valid and new! Just add it already.
            order.updates.push({status: status, timeStamp: $.now()});
          }
        } else {
          // Extension could need updated if it gets here.
          order.error = 'update_invalid_status_error';
          return;
        }
      } else {
        // Bad user data or extension could need updated.
        order.error = 'update_status_not_found_error';
        return;
      }
      // Only update the Track link if it was found.
      if (trackingUrl) order.trackingUrl = trackingUrl;
      // Clear any pre-existing errors.
      order.error = '';
    }).error(function () {
      // Something went wrong.
      order.error = 'update_page_not_found_error';
    }).complete(function () {
      // Done! Now let's tell the boss.
      callback.apply(updateManager, [order]);
    });
  }

  // Build the HTML to populate the popup with to optimize popup loading
  // times and updates any popup currently being displayed.
  function updatePopup() {
    buildPopup();
    var popup = chrome.extension.getViews({type: 'popup'})[0];
    if (popup) popup.document.body.innerHTML = ext.popupHtml;
  }

  // Update Manager setup
  // --------------------

  // Central manager for updating the orders.  
  // This manager can handle concurrent start, stop and restart requests while
  // also supporting repeat (looping) functionality.
  var updateManager = {

    // Unique interval identifier used to managed repeating updates.
    id: undefined,

    // Message stack used by the current update process.  
    // Any start/stop/restart requests made while the manager is updating is
    // added to this stack and actioned upon completion of the process.
    // Afterwards, the stack is cleared for the next process.
    messages: [],

    // Indicate whether or not the update manager is currently running through
    // an update process.
    updating: false,

    // Restart the update manager, which may run once or start a repeating
    // cycle based on the current update frequency.  
    // If this is called during an active update process the manager will
    // restart upon completion.
    restart: function () {
      var frequency = utils.get('frequency');
      // I'm busy; I'll do it later.
      if (this.updating) {
        this.messages.push('restart');
        return;
      }
      // Clear the current cycle, where applicable.
      if (this.id) {
        clearInterval(this.id);
        // Ensure that it is disabled, where applicable.
        if (frequency === -1) this.id = undefined;
      }
      // Start a new cycle if required.
      if (frequency !== -1) this.id = setInterval(this.run, frequency);
      // Run the initial process.
      this.run();
    },

    // Core of the update manager which actually performs the update process.  
    // This process updates all orders and ensures the results are reflected in
    // the popup.
    run: function () {
      var progress = 0;
      this.updating = true;
      // Update the UI to show that I'm busy.
      notify();
      updatePopup();

      // Called when the AJAX request has been parsed and read for each
      // order.  
      // This should be called regardless of errors being encountered.
      function updated(order) {
        progress++;
        // Check if all orders have been updated; supports no orders.
        if (progress >= ext.orders.length) {
          this.updating = false;
          // Persist orders and update time stamp.
          utils.set('orders', ext.orders);
          utils.set('lastUpdated', $.now());
          // Update the UI again to reflect the changes.
          notify();
          updatePopup();
          // Now read the message stack.
          for (var i = 0; i < this.messages.length; i++) {
            this[this.messages[i]]();
          }
          this.messages = [];
        }
      }

      // Finish this now since no orders exist.
      if (!ext.orders.length) updated.apply(this);
      // Update each order by parsing its page on the Apple US store.
      for (var i = 0; i < ext.orders.length; i++) {
        updateOrder(ext.orders[i], updated);
      }
    },

    // Start the update manager, which may run once or start a repeating cycle
    // based on the current update frequency.
    start: function () {
      var frequency = utils.get('frequency');
      // Clear the current cycle, where applicable.
      if (frequency === -1) {
        if (this.id) {
          clearInterval(this.id);
          this.id = undefined;
        }
      } else {
        // I start twice for no one... see RESTART for that.
        if (this.id) return;
        // Start a new cycle.
        this.id = setInterval(this.run, frequency);
      }
      // Run the initial process.
      this.run();
    },

    // Stop the update manager.  
    // If this is called during an active update process the manager will stop
    // upon completion.
    stop: function () {
      // I'm busy; I'll do it later.
      if (this.updating) {
        this.messages.push('stop');
        return;
      }
      // Clear the current cycle, where possible.
      if (this.id) {
        clearInterval(this.id);
        this.id = undefined;
      }
    }

  };

  // Background page setup
  // ---------------------

  var ext = window.ext = {

    // Public constants
    // ----------------

    // Details for the supported update frequencies.
    FREQUENCIES: [{
      text  : utils.i18n('freq_disabled'),
      value : -1
    }, {
      text  : utils.i18n('freq_minutes', '15'),
      value : 15 * 60 * 1000
    }, {
      text  : utils.i18n('freq_minutes', '30'),
      value : 30 * 60 * 1000
    }, {
      text  : utils.i18n('freq_minutes', '45'),
      value : 45 * 60 * 1000
    }, {
      text  : utils.i18n('freq_hour'),
      value : 60 * 60 * 1000
    }, {
      text  : utils.i18n('freq_hours', '2'),
      value : 2 * 60 * 60 * 1000
    }],

    // Public variables
    // ----------------

    // List of orders currently being maintained.  
    // This should always be an exact reflection of the orders persisted in
    // `localStorage`.
    orders: [],

    // Pre-prepared HTML for the popup to be populated using.  
    // This should be updated whenever orders are changed/updated in any way as
    // this is generated to improve performance and load times of the popup
    // frame.
    popupHtml: '',

    // Public functions
    // ----------------

    // Attempt to return the order whose details match the specified criteria.
    getOrder: function (number, code) {
      for (var i = 0; i < ext.orders.length; i++) {
        if (ext.orders[i].number === number && ext.orders[i].code === code) {
          return ext.orders[i];
        }
      }
    },

    // Initialize the background page.  
    // This will involve initializing the settings, adding the request
    // listeners and starting the update manager.
    init: function () {
      utils.init('update_progress', {});
      init_update();
      utils.init('badges', true);
      utils.init('frequency', ext.FREQUENCIES[1].value);
      utils.init('lastRead', $.now());
      utils.init('lastUpdated', $.now());
      utils.init('notifications', true);
      utils.init('notificationDuration', 6 * 1000);
      initOrders();
      chrome.extension.onRequest.addListener(onRequest);
      // It's nice knowing what version is running.
      $.getJSON(chrome.extension.getURL('manifest.json'), function (data) {
        ext.version = data.version;
        // Execute content scripts now that we know the version.
        executeScriptsInExistingWindows();
      });
      // It's alive!
      updateManager.start();
    }

  };

}(this));
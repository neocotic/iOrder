// [iOrder](http://neocotic.com/iOrder)  
// (c) 2011 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/iOrder>

(function (window) {

  // Private variables
  // -----------------

  // Easily accessible reference to the extension controller.
  var ext = chrome.extension.getBackgroundPage().ext;

  // Load functions
  // --------------

  // Update the options page with the values from the current settings.
  function load() {
    loadFrequencies();
    loadNotifications();
    loadOrders();
    loadOrderControlEvents();
  }

  // Update the frequency section of the options page with the current
  // settings.
  function loadFrequencies() {
    var frequency = $('#frequency');
    // Start from a clean slate.
    frequency.remove('option');
    // Create and insert options representing each available update frequency.
    for (var i = 0; i < ext.FREQUENCIES.length; i++) {
      frequency.append($('<option/>', {
        text  : ext.FREQUENCIES[i].text,
        value : ext.FREQUENCIES[i].value
      }));
    }
    // Select the option for the current update frequency.
    frequency.find('option[value="' + utils.get('frequency') +
        '"]').attr('selected', 'selected');
  }

  // Update the notification section of the options page with the current
  // settings.
  function loadNotifications() {
    if (utils.get('badges')) {
      $('#badges').attr('checked', 'checked');
    } else {
      $('#badges').removeAttr('checked');
    }
    if (utils.get('notifications')) {
      $('#notifications').attr('checked', 'checked');
    } else {
      $('#notifications').removeAttr('checked');
    }
    var timeInSecs = 0;
    if (utils.get('notificationDuration') > timeInSecs) {
      timeInSecs = utils.get('notificationDuration') / 1000;
    }
    $('#notificationDuration').val(timeInSecs);
  }

  // Create a `<optgroup>` element representing the specified order.  
  // The element returned should then be inserted in to the `<select>` managing
  // the orders on the options page.
  function loadOrder(order) {
    var opt = $('<option/>', {text: order.label});
    opt.data('code',    order.code);
    opt.data('updates', JSON.stringify(order.updates));
    return $('<optgroup/>', {label: order.number}).append(opt);
  }

  // Bind the event handlers required for controlling the orders.
  function loadOrderControlEvents() {
    var
      lastSelectedOrder = {},
      orders            = $('#orders'),
      updates           = $('#updates');
    // Whenever the selected option changes we want all the controls to
    // represent the current selection (where possible).
    orders.change(function () {
      var
        $this  = $(this),
        opt    = $this.find('option:selected'),
        optGrp = opt.parent('optgroup');
      // Update the previously selected order.
      if (lastSelectedOrder.length) {
        updateOrder(lastSelectedOrder.parent('optgroup'));
      }
      if (opt.length === 0) {
        // Disable all the controls as no option is selected.
        lastSelectedOrder = {};
        utils.i18nContent('#add_btn', 'opt_add_button');
        $('.read-only, .read-only-always').removeAttr('disabled');
        $('.read-only, .read-only-always').removeAttr('readonly');
        $('#delete_btn').attr('disabled', 'disabled');
        $('#order_code').val('');
        $('#order_label').val('');
        $('#order_number').val('');
        // Wipe the status updates.
        updates.find('optgroup').remove();
      } else {
        // An order is selected; start cooking.
        lastSelectedOrder = opt;
        utils.i18nContent('#add_btn', 'opt_add_new_button');
        $('.read-only-always').attr('disabled', 'disabled');
        $('.read-only-always').attr('readonly', 'readonly');
        // Update the fields and controls to reflect selected option.
        $('#order_code').val(opt.data('code'));
        $('#order_label').val(opt.text());
        $('#order_number').val(optGrp.attr('label'));
        updates.find('optgroup').remove();
        var orderUpdates = JSON.parse(opt.data('updates'));
        // Populate the status updates.
        for (var i = 0; i < orderUpdates.length; i++) {
          updates.append($('<optgroup/>', {
            label : new Date(orderUpdates[i].timeStamp).format('d/m/Y @ H:i:s')
          }).append($('<option/>', {
            text  : orderUpdates[i].status
          })));
        }
        $('.read-only').removeAttr('disabled');
        $('.read-only').removeAttr('readonly');
      }
    }).change();
    // Add a new order to the select based on the input values.
    $('#add_btn').click(function () {
      var
        opt    = orders.find('option:selected'),
        optGrp = opt.parent('optgroup');
      if (optGrp.length && opt.length) {
        // Order was selected; clear that selection and allow creation.
        orders.val([]).change();
        $('#order_label').focus();
      } else {
        // Wipe any pre-existing error messages.
        $('#errors').find('li').remove();
        // User submitted new order so check it out already.
        optGrp = loadOrder({
          code        : $('#order_code').val().trim().toUpperCase(),
          error       : '',
          label       : $('#order_label').val().trim(),
          number      : $('#order_number').val().trim().toUpperCase(),
          trackingUrl : '',
          updates     : []
        });
        opt = optGrp.find('option');
        // Confirm the order meets the criteria.
        if (validateOrder(optGrp, true)) {
          orders.append(optGrp);
          opt.attr('selected', 'selected');
          orders.change().focus();
        } else {
          // Show the error messages to the user.
          $.facebox({div: '#message'});
        }
      }
    });
    // Prompt the user to confirm removal of the selected order.
    $('#delete_btn').click(function () {
      $.facebox({div: '#delete_con'});
    });
    // Cancel the order removal process.
    $('.delete_no_btn').live('click', function () {
      $(document).trigger('close.facebox');
    });
    // Finalize the order removal.
    $('.delete_yes_btn').live('click', function () {
      var optGrp = orders.find('option:selected').parent('optgroup');
      optGrp.remove();
      orders.change().focus();
      $(document).trigger('close.facebox');
    });
  }

  // Update the orders section of the options page with the current settings.
  function loadOrders() {
    var orders = $('#orders');
    // Start from a clean slate.
    orders.remove('optgroup');
    // Create and insert options representing each order.
    for (var i = 0; i < ext.orders.length; i++) {
      orders.append(loadOrder(ext.orders[i]));
    }
  }

  // Save functions
  // --------------

  // Update the settings with the values from the options page.  
  // Restart the update manager once all settings have been updated.
  function save() {
    saveOrders();
    saveNotifications();
    saveFrequencies();
    // Reboot the boss so it knows of any changes.
    chrome.extension.sendRequest({type: 'refresh'});
  }

  // Update the settings with the values from the frequency section of the
  // options page.
  function saveFrequencies() {
    var frequency = $('#frequency option:selected').val();
    utils.set('frequency', parseInt(frequency, 10));
  }

  // Update the settings with the values from the notification section of the
  // options page.
  function saveNotifications() {
    utils.set('badges', $('#badges').is(':checked'));
    utils.set('notifications', $('#notifications').is(':checked'));
    var timeInSecs = $('#notificationDuration').val();
    timeInSecs = (timeInSecs) ? parseInt(timeInSecs, 10) * 1000 : 0;
    utils.set('notificationDuration', timeInSecs);
  }

  // Update the settings with the values from the orders section of the options
  // page.
  function saveOrders() {
    var
      order  = {},
      orders = [];
    // Update each individual order settings based on their corresponding
    // options.
    $('#orders optgroup').each(function () {
      order = deriveOrder($(this));
      orders.push(order);
    });
    // Persist the updated orders.
    utils.set('orders', orders);
    ext.orders = orders;
  }

  // Update the specified `<optgroup>` element that represents an order with
  // values taken from the available fields.
  function updateOrder(optGrp) {
    var opt = optGrp.find('option');
    if (optGrp.length && opt.length) {
      opt.data('code', $('#order_code').val().trim().toUpperCase());
      opt.text($('#order_label').val().trim());
      optGrp.attr('number', $('#order_number').val().trim().toUpperCase());
      return opt;
    }
  }

  // Validation functions
  // --------------------

  // Determine whether or not an order already exists with the specified
  // number.
  function isOrderNumberAvailable(number) {
    var available = true;
    $('#orders optgroup').each(function () {
      if ($(this).attr('label') === number) {
        available = false;
        return false;
      }
    });
    return available;
  }

  // Validate that the specified `<optgroup>` element that should represents an
  // order does just that.  
  // This function adds any validation errors it encounters to an unordered
  // list which should be displayed to the user at some point if `true` is
  // returned.
  function validateOrder(optGrp, isNew) {
    var
      opt    = optGrp.find('option'),
      code   = opt.data('code').trim().toUpperCase(),
      errors = $('#errors'),
      label  = opt.text().trim(),
      number = optGrp.attr('label').trim().toUpperCase();
    // Label is missing but is required.
    if (label.length === 0) createError('opt_order_label_invalid');
    // Only validate new order numbers.
    if (isNew) {
      // Number is required and must be available.
      if (number.length === 0) {
        createError('opt_order_number_invalid');
      } else if (!isOrderNumberAvailable(number)) {
        createError('opt_order_number_unavailable');
      }
    }
    // Zip/post code is missing but is required.
    if (code.length === 0) createError('opt_order_code_invalid');
    return errors.find('li').length === 0;
  }

  // Validate all `<optgroup>` elements that represent orders that are to be
  // persisted in `localStorage`.  
  // This function adds any validation errors it encounters to a unordered list
  // which should be displayed to the user at some point if `true` is returned.
  function validateOrders() {
    var
      errors = $('#errors'),
      orders = $('#orders optgroup');
    // Wipe any pre-existing errors.
    errors.remove('li');
    orders.each(function () {
      var $this = $(this);
      if (!validateOrder($this)) {
        // Show user which validation failed validation.
        $this.find('option').attr('selected', 'selected');
        $('#orders').change().focus();
        return false;
      }
    });
    return errors.find('li').length === 0;
  }

  // Miscellaneous functions
  // -----------------------

  // Appends a new `<li>` element containing an internationalized error string,
  // looked up using Chrome, to the unordered list of errors.
  function createError(name) {
    return $('<li/>', {html: utils.i18n(name)}).appendTo($('#errors'));
  }

  // Create an order with the information derived from the specified
  // `<optgroup>` element.
  function deriveOrder(optGrp) {
    var
      opt = optGrp.find('option'),
      order;
    if (optGrp.length && opt.length) {
      // Create order from the derived data.
      order = {
        code        : opt.data('code'),
        error       : '',
        label       : opt.text(),
        number      : optGrp.attr('label'),
        trackingUrl : '',
        updates     : []
      };
      // Try to get the data from existing order.
      var existingOrder = ext.getOrder(order.number, order.code);
      if (existingOrder) {
        order.error       = existingOrder.error;
        order.trackingUrl = existingOrder.trackingUrl;
        order.updates     = existingOrder.updates;
      }
    }
    return order;
  }

  // Options page setup
  // ------------------

  var options = window.options = {

    // Public functions
    // ----------------

    // Initialize the options page.  
    // This will involve inserting and configuring the UI elements as well as
    // loading the current settings.
    init: function () {
      utils.i18nSetup({footer: {opt_footer: new Date().format('Y')}});
      // Bind tab selection event to all tabs.
      $('#navigation li').click(function () {
        var $this = $(this);
        if (!$this.hasClass('selected')) {
          $this.siblings().removeClass('selected');
          $this.addClass('selected');
          $($this.attr('data-href')).show().siblings('.tab').hide();
          utils.set('options_active_tab', $this.attr('id'));
        }
      });
      // Reflect the persisted tab.
      utils.init('options_active_tab', 'general_nav');
      $('#' + utils.get('options_active_tab')).click();
      // Bind event to the "Save & Close" button which will update the settings
      // with the values from the options page and close the current tab.  
      // None of this should happen if the invalid orders are found; in which
      // case the user is notified of these errors.
      $('.save-btn').click(function () {
        updateOrder($('#orders option:selected').parent('optgroup'));
        if (validateOrders()) {
          save();
          chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.remove(tab.id);
          });
        } else {
          $.facebox({div: '#message'});
        }
      });
      // Load the current option values.
      load();
      // Initialize all faceboxes.
      $('a[rel*=facebox]').facebox();
    },

    // Ensure that the persisted tab is currently visible.  
    // This should be called if the user clicks the Options link in the popup
    // while and options page is already open.
    refresh: function () {
      // Ensure the persisted tab is visible
      $('#' + utils.get('options_active_tab')).click();
    }

  };

}(this));
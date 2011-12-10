/* Copyright (C) 2011 Alasdair Mercer, http://neocotic.com/
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy  
 * of this software and associated documentation files (the "Software"), to deal  
 * in the Software without restriction, including without limitation the rights  
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
 * copies of the Software, and to permit persons to whom the Software is  
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all  
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
 * SOFTWARE.
 */

/**
 * <p>Easily accessible reference to the extension controller.</p>
 * @ignore
 */
var ext = chrome.extension.getBackgroundPage().ext;

/**
 * <p>Responsible for the options page.</p>
 * @author <a href="http://neocotic.com">Alasdair Mercer</a>
 * @since 1.0.0
 * @requires jQuery
 * @namespace
 */
var options = {

    /**
     * <p>The list of existing order numbers.</p>
     * <p>This is used to determine whether or not an order number already
     * exists.</p>
     * @private
     * @type String[]
     */
    orderNumbers: [],

    /**
     * <p>Creates an order with the information derived from the specified
     * <code>&lt;optgroup/&gt;</code> element.</p>
     * @param {jQuery} optGrp The <code>&lt;optgroup/&gt;</code> element in a
     * jQuery wrapper.
     * @return {Object} The order created from the jQuery object.
     * @private
     */
    deriveOrder: function (optGrp) {
        var opt = optGrp.find('option'),
            order;
        if (optGrp.length && opt.length) {
            // Create order from derived data
            order = {
                code: opt.data('code'),
                error: '',
                label: opt.text(),
                number: optGrp.attr('label'),
                trackingUrl: '',
                updates: []
            };
            // Try to get data from existing order
            var existingOrder = ext.getOrder(order.number, order.code);
            if (existingOrder) {
                order.error = existingOrder.error;
                order.trackingUrl = existingOrder.trackingUrl;
                order.updates = existingOrder.updates;
            }
        }
        return order;
    },

    /**
     * <p>Formats the given time stamp for display in the updates list.</p>
     * <p>The time stamp is formatted as
     * <code>dd/MM/yyyy @ HH:mm:ss</code>.</p>
     * @param {Integer} timeStamp The time stamp to be formatted.
     * @returns {String} The formatted time stamp.
     * @private
     */
    formatTimeStamp: function (timeStamp) {
        var date = new Date(timeStamp),
            str = '';
        str += utils.leftPad(date.getDate(), 2, 0) + '/';
        str += utils.leftPad(date.getMonth() + 1, 2, 0) + '/';
        str += date.getFullYear() + ' @ ';
        str += utils.leftPad(date.getHours(), 2, 0) + ':';
        str += utils.leftPad(date.getMinutes(), 2, 0) + ':';
        str += utils.leftPad(date.getSeconds(), 2, 0);
        return str;
    },

    /**
     * <p>Replaces the value of the specified attribute of the selected
     * element(s) to the internationalized <code>String</code> looked up using
     * Chrome.</p>
     * @param {String} selector A <code>String</code> containing a jQuery
     * selector expression to find the element(s) to be modified.
     * @param {String} attribute The name of the attribute to be modified.
     * @param {String} name The name of the internationalized message to be
     * retrieved.
     * @param {String|String[]} [sub] The <code>String</code>(s) to substituted
     * in the returned message (where applicable).
     * @returns {jQuery} The modified element(s) wrapped in jQuery.
     * @private
     */
    i18nAttribute: function (selector, attribute, name, sub) {
        // Wrap it up
        if (typeof sub === 'string') {
            sub = [sub];
        }
        return $(selector).attr(attribute, chrome.i18n.getMessage(name, sub));
    },

    /**
     * <p>Replaces the inner HTML of the selected element(s) with the
     * internationalized <code>String</code> looked up using Chrome.</p>
     * @param {String} selector A <code>String</code> containing a jQuery
     * selector expression to find the element(s) to be modified.
     * @param {String} name The name of the internationalized message to be
     * retrieved.
     * @param {String|String[]} [sub] The <code>String</code>(s) to substituted
     * in the returned message (where applicable).
     * @returns {jQuery} The modified element(s) wrapped in jQuery.
     * @private
     */
    i18nReplace: function (selector, name, sub) {
        // Wrap it up
        if (typeof sub === 'string') {
            sub = [sub];
        }
        return $(selector).html(chrome.i18n.getMessage(name, sub));
    },

    /**
     * <p>Initializes the options page.</p>
     * <p>This involves inserting and configuring the UI elements as well as
     * the insertion of internationalized <code>Strings</code> and, most
     * importantly, loading the current settings.</p>
     */
    init: function () {
        // Insert internationalized Strings
        options.i18nReplace('title', 'name');
        options.i18nReplace('#errors_hdr', 'opt_errors_header');
        options.i18nReplace('#add_btn', 'opt_add_button');
        options.i18nReplace('#delete_btn', 'opt_delete_button');
        options.i18nReplace('#orders_hdr, #orders_nav', 'opt_order_header');
        options.i18nReplace('#order_label_txt', 'opt_order_label_text');
        options.i18nReplace('#order_number_txt', 'opt_order_number_text');
        options.i18nReplace('#order_code_txt', 'opt_order_code_text');
        options.i18nReplace('#updates_txt', 'opt_order_updates_text');
        options.i18nAttribute('a[rel=facebox]', 'title', 'opt_help_text');
        options.i18nReplace('#general_hdr, #general_nav',
                'opt_general_header');
        options.i18nReplace('#frequency_txt', 'opt_frequency_text');
        options.i18nReplace('#notifications_hdr', 'opt_notification_header');
        options.i18nReplace('#badges_txt', 'opt_badge_text');
        options.i18nReplace('#notifications_txt', 'opt_notification_text');
        options.i18nReplace('#notificationDuration_txt1',
                'opt_notification_timer_text1');
        options.i18nReplace('#notificationDuration_txt2',
                'opt_notification_timer_text2');
        options.i18nReplace('.save-btn', 'opt_save_button');
        options.i18nReplace('#footer', 'opt_footer',
                String(new Date().getFullYear()));
        // Insert internationalized help/confirmation sections
        options.i18nReplace('#frequency_help', 'help_frequency');
        options.i18nReplace('#badges_help', 'help_badges');
        options.i18nReplace('#notifications_help', 'help_notifications');
        options.i18nReplace('#notificationDuration_help',
                'help_notificationDuration');
        options.i18nReplace('#delete_con', 'confirm_delete');
        options.i18nReplace('#order_label_help', 'help_order_label');
        options.i18nReplace('#order_number_help', 'help_order_number');
        options.i18nReplace('#order_code_help', 'help_order_code');
        options.i18nReplace('#updates_help', 'help_updates');
        // Bind tab selection event to all tabs
        $('#navigation li').click(function (event) {
            var $this = $(this);
            if (!$this.hasClass('selected')) {
                $this.siblings().removeClass('selected');
                $this.addClass('selected');
                $($this.attr('data-href')).show().siblings('.tab').hide();
                utils.set('options_active_tab', $this.attr('id'));
            }
        });
        // Reflect the persisted tab
        utils.init('options_active_tab', 'general_nav');
        $('#' + utils.get('options_active_tab')).click();
        // Bind options:saveAndClose event to its button
        $('.save-btn').click(options.saveAndClose);
        // Load the current option values
        options.load(true);
        // Initialize facebox
        $('a[rel*=facebox]').facebox();
    },

    /**
     * <p>Indicates whether or not an order already exists with the specified
     * number.</p>
     * @param {String} number The order number to be checked.
     * @returns {Boolean} <code>true</code> if no order exists with the number
     * provided; otherwise <code>false</code>.
     * @private
     */
    isOrderNumberAvailable: function (number) {
        var available = true;
        $('#orders optgroup').each(function () {
            if ($(this).attr('label') === number) {
                available = false;
                return false;
            }
        });
        return available;
    },

    /**
     * <p>Updates the options page with the values of the current settings.</p>
     * @param {Boolean} loadEvents <code>true</code> to bind events required
     * for managing orders; otherwise <code>false</code>.
     * @private
     */
    load: function (loadEvents) {
        options.loadFrequencies();
        options.loadNotifications();
        options.loadOrders();
        // Load all event handlers required for managing orders, if required
        if (loadEvents) {
            options.loadOrderControlEvents();
        }
    },

    /**
     * <p>Updates the frequency section of the options page with the current
     * settings.</p>
     * @private
     */
    loadFrequencies: function () {
        var frequency = $('#frequency');
        // Start from clean slate
        frequency.remove('option');
        // Create and insert options representing each update frequency
        for (var i = 0; i < ext.frequencies.length; i++) {
            frequency.append($('<option/>', {
                text: ext.frequencies[i].text,
                value: ext.frequencies[i].value
            }));
        }
        // Select the option for the current update frequency
        frequency.find('option[value="' + utils.get('frequency') +
                '"]').attr('selected', 'selected');
    },

    /**
     * <p>Updates the notification section of the options page with the current
     * settings.</p>
     * @private
     */
    loadNotifications: function () {
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
    },

    /**
     * <p>Creates a <code>&lt;optgroup/&gt;</code> element representing the
     * specified order.</p>
     * <p>The returned element should then be inserted in to the
     * <code>&lt;select/&gt;</code> managing orders on the options page.</p>
     * @param {Object} order The order to be used.
     * @returns {jQuery} The <code>&lt;optgroup/&gt;</code> element in a jQuery
     * wrapper.
     * @private
     */
    loadOrder: function (order) {
        var opt = $('<option/>', {
            text: order.label
        });
        opt.data('code', order.code);
        opt.data('updates', JSON.stringify(order.updates));
        return $('<optgroup/>', {
            label: order.number
        }).append(opt);
    },

    /**
     * <p>Binds the event handlers required for controlling the orders.</p>
     * @private
     */
    loadOrderControlEvents: function () {
        var lastSelectedOrder = {},
            orders = $('#orders'),
            updates = $('#updates');
        /*
         * Whenever the selected option changes we want all the controls to
         * represent the current selection (where possible).
         */
        orders.change(function (event) {
            var $this = $(this),
                opt = $this.find('option:selected'),
                optGrp = opt.parent('optgroup');
            // Update the previously selected order
            if (lastSelectedOrder.length) {
                options.updateOrder(lastSelectedOrder.parent('optgroup'));
            }
            if (opt.length === 0) {
                // Disable all the controls as no option is selected
                lastSelectedOrder = {};
                options.i18nReplace('#add_btn', 'opt_add_button');
                $('.read-only, .read-only-always').removeAttr('disabled');
                $('.read-only, .read-only-always').removeAttr('readonly');
                $('#delete_btn').attr('disabled', 'disabled');
                $('#order_code').val('');
                $('#order_label').val('');
                $('#order_number').val('');
                // Wipes status updates
                updates.find('optgroup').remove();
            } else {
                // An order is selected; start cooking
                lastSelectedOrder = opt;
                options.i18nReplace('#add_btn', 'opt_add_new_button');
                $('.read-only-always').attr('disabled', 'disabled');
                $('.read-only-always').attr('readonly', 'readonly');
                // Update the fields and controls to reflect selected option
                $('#order_code').val(opt.data('code'));
                $('#order_label').val(opt.text());
                $('#order_number').val(optGrp.attr('label'));
                updates.find('optgroup').remove();
                var orderUpdates = JSON.parse(opt.data('updates'));
                // Populate status updates
                for (var i = 0; i < orderUpdates.length; i++) {
                    updates.append($('<optgroup/>', {
                        label: options.formatTimeStamp(
                            orderUpdates[i].timeStamp
                        )
                    }).append($('<option/>', {
                        text: orderUpdates[i].status
                    })));
                }
                $('.read-only').removeAttr('disabled');
                $('.read-only').removeAttr('readonly');
            }
        }).change();
        // Add a new order to the select based on the input values
        $('#add_btn').click(function (event) {
            var opt = orders.find('option:selected'),
                optGrp = opt.parent('optgroup');
            if (optGrp.length && opt.length) {
                // Order was selected; clear that selection and allow creation
                orders.val([]).change();
                $('#order_label').focus();
            } else {
                // Wipe any pre-existing error messages
                $('#errors').find('li').remove();
                // User submitted new order so check it out already
                optGrp = options.loadOrder({
                    code: $('#order_code').val().trim().toUpperCase(),
                    error: '',
                    label: $('#order_label').val().trim(),
                    number: $('#order_number').val().trim().toUpperCase(),
                    trackingUrl: '',
                    updates: []
                });
                opt = optGrp.find('option');
                // Confirm the order meets the criteria
                if (options.validateOrder(optGrp, true)) {
                    orders.append(optGrp);
                    opt.attr('selected', 'selected');
                    orders.change().focus();
                } else {
                    // Show the error messages to the user
                    $.facebox({div: '#message'});
                }
            }
        });
        // Prompt the user to confirm removal of the selected order
        $('#delete_btn').click(function (event) {
            $.facebox({div: '#delete_con'});
        });
        // Cancel the order removal process
        $('.delete_no_btn').live('click', function (event) {
            $(document).trigger('close.facebox');
        });
        // Finalize the order removal
        $('.delete_yes_btn').live('click', function (event) {
            var optGrp = orders.find('option:selected').parent('optgroup');
            optGrp.remove();
            orders.change().focus();
            $(document).trigger('close.facebox');
        });
    },

    /**
     * <p>Updates the orders section of the options page with the current
     * settings.</p>
     * @private
     */
    loadOrders: function () {
        var orders = $('#orders');
        // Start from clean slate
        orders.remove('optgroup');
        options.orderNumbers = [];
        // Create and insert options representing each order
        for (var i = 0; i < ext.orders.length; i++) {
            orders.append(options.loadOrder(ext.orders[i]));
            // Store order number initially (to prevent duplicates)
            options.orderNumbers.push(ext.orders[i].number);
        }
    },

    /**
     * <p>Ensures that the persisted tab is currently visible.</p>
     * <p>This is called if the user clicks the Options link in the popup while
     * and options page is already open.</p>
     */
    refresh: function () {
        // Ensure the persisted tab is visible
        $('#' + utils.get('options_active_tab')).click();
    },

    /**
     * <p>Updates the settings with the values from the options page.</p>
     * <p>The update manager will be restarted once all settings have been
     * updated.</p>
     * @private
     */
    save: function () {
        options.saveOrders();
        options.saveNotifications();
        options.saveFrequencies();
        // Reboot the boss so it knows of any changes
        ext.updateManager.restart();
    },

    /**
     * <p>Updates the settings with the values from the options page and closes
     * the current tab.</p>
     * <p>None of this will happen if the invalid orders are found; in which
     * case the user is notified of these errors.</p>
     * @param {Event} [event] The event triggered.
     * @private
     * @event
     */
    saveAndClose: function (event) {
        options.updateOrder($('#orders option:selected').parent('optgroup'));
        if (options.validateOrders()) {
            options.save();
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.remove(tab.id);
            });
        } else {
            $.facebox({div: '#message'});
        }
    },

    /**
     * <p>Updates the settings with the values from the frequency section of
     * the options page.</p>
     * @private
     */
    saveFrequencies: function () {
        var frequency = $('#frequency option:selected').val();
        utils.set('frequency', parseInt(frequency, 10));
    },

    /**
     * <p>Updates the settings with the values from the notification section of
     * the options page.</p>
     * @private
     */
    saveNotifications: function () {
        utils.set('badges', $('#badges').is(':checked'));
        utils.set('notifications', $('#notifications').is(':checked'));
        var timeInSecs = $('#notificationDuration').val();
        timeInSecs = (timeInSecs) ? parseInt(timeInSecs, 10) * 1000 : 0;
        utils.set('notificationDuration', timeInSecs);
    },

    /**
     * <p>Updates the settings with the values from the orders section of
     * the options page.</p>
     * @private
     */
    saveOrders: function () {
        var order = {}, orders = [];
        /*
         * Update each individual order settings based on their corresponding
         * options.
         */
        $('#orders optgroup').each(function () {
            order = options.deriveOrder($(this));
            orders.push(order);
        });
        // Persist the updated orders
        utils.set('orders', orders);
        ext.orders = orders;
    },

    /**
     * <p>Updates the specified &lt;optgroup&gt; element that represents an
     * order with values taken from the available fields.</p>
     * @param {jQuery} optGrp The jQuery wrapped &lt;optgroup&gt; to be
     * updated.
     * @private
     */
    updateOrder: function (optGrp) {
        var opt = optGrp.find('option');
        if (optGrp.length && opt.length) {
            opt.data('code', $('#order_code').val().trim().toUpperCase());
            opt.text($('#order_label').val().trim());
            optGrp.attr('number',
                    $('#order_number').val().trim().toUpperCase());
            return opt;
        }
    },

    /**
     * <p>Validates that the specified &lt;optgroup&gt; element that should
     * represents an order does just that.</p>
     * <p>This function adds any validation errors it encounters to an
     * unordered list which should be displayed to the user at some point if
     * <code>true</code> is returned.</p>
     * @param {jQuery} optGrp The jQuery wrapped &lt;optgroup&gt; to be
     * validated.
     * @param {Boolean} [isNew=false] <code>true</code> if the order has yet to
     * be added; otherwise <code>false</code>.
     * @returns {Boolean} <code>true</code> if validation errors were
     * encountered; otherwise <code>false</code>.
     * @private
     */
    validateOrder: function (optGrp, isNew) {
        var opt = optGrp.find('option'),
            code = opt.data('code').trim().toUpperCase(),
            errors = $('#errors'),
            label = opt.text().trim(),
            number = optGrp.attr('label').trim().toUpperCase();
        /**
         * <p>Appends a new &lt;li&gt; element containing an internationalized
         * error <code>String</code> looked up using Chrome to the unordered
         * list of errors.</p>
         * @param {String} name The name of the internationalized error message
         * to be retrieved.
         * @returns {jQuery} The new &lt;li&gt; element wrapped in jQuery.
         * @ignore
         */
        function createError(name) {
            return $('<li/>', {
                html: chrome.i18n.getMessage(name)
            }).appendTo(errors);
        }
        // Label is required
        if (label.length === 0) {
            createError('opt_order_label_invalid');
        }
        // Only validate new order numbers
        if (isNew) {
            // Number is required and must be available
            if (number.length === 0) {
                createError('opt_order_number_invalid');
            } else if (!options.isOrderNumberAvailable(number)) {
                createError('opt_order_number_unavailable');
            }
        }
        // Zip/post code is required
        if (code.length === 0) {
            createError('opt_order_code_invalid');
        }
        return errors.find('li').length === 0;
    },

    /**
     * <p>Validates all &lt;optgroup&gt; elements that represent orders that
     * are to be persisted in <code>localStorage</code>.</p>
     * <p>This function adds any validation errors it encounters to a unordered
     * list which should be displayed to the user at some point if
     * <code>true</code> is returned.</p>
     * @returns {Boolean} <code>true</code> if validation errors were
     * encountered; otherwise <code>false</code>.
     * @private
     */
    validateOrders: function () {
        var errors = $('#errors'),
            orders = $('#orders optgroup');
        // Wipe all pre-existing errors
        errors.remove('li');
        orders.each(function () {
            var $this = $(this);
            if (!options.validateOrder($this)) {
                // Show user which validation failed validation
                $this.find('option').attr('selected', 'selected');
                $('#orders').change().focus();
                return false;
            }
        });
        return errors.find('li').length === 0;
    }

};
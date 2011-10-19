/* Copyright 2011 Alasdair Mercer
 * 
 * This file is part of iOrder.
 * 
 * iOrder is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * iOrder is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with iOrder. If not, see http://www.gnu.org/licenses/.
 */

/**
 * <p>Main controller for the extension and manages all interactions and
 * requests.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 1.0.0
 * @requires jQuery
 * @namespace
 */
var ext = {

    /**
     * <p>The details of the update frequencies supported.</p>
     * @type Object[]
     */
    frequencies: [{
        text: chrome.i18n.getMessage('freq_disabled'),
        value: -1
    }, {
        text: chrome.i18n.getMessage('freq_minutes', '5'),
        value: 5 * 60 * 1000
    }, {
        text: chrome.i18n.getMessage('freq_minutes', '10'),
        value: 10 * 60 * 1000
    }, {
        text: chrome.i18n.getMessage('freq_minutes', '15'),
        value: 15 * 60 * 1000
    }, {
        text: chrome.i18n.getMessage('freq_minutes', '30'),
        value: 30 * 60 * 1000
    }, {
        text: chrome.i18n.getMessage('freq_hour'),
        value: 60 * 60 * 1000
    }, {
        text: chrome.i18n.getMessage('freq_hours', '2'),
        value: 2 * 60 * 60 * 1000
    }],

    /**
     * <p>The base URL (incl. domain and path) of order pages on the Apple US
     * store.</p>
     * <p>The remaining path segments include the number and delivery zip/post
     * code, in that order.</p>
     * @private
     * @type String
     */
    orderUrl: 'https://store.apple.com/us/order/guest/',

    /**
     * <p>The list of orders currently being maintained by this extension.</p>
     * <p>This should be an exact reflection of the orders persisted in
     * <code>localStorage</code>.</p>
     * @type Object[]
     */
    orders: [],

    /**
     * <p>The URL of the Apple US store orders list for an account.</p>
     * @private
     * @type String
     */
    ordersUrl: 'https://store.apple.com/us/order/list',

    /**
     * <p>The HTML to populate the popup with.</p>
     * <p>This should be updated whenever orders are changed/updated as this is
     * generated to improve performance and load times of the popup frame.</p>
     * @type String
     */
    popupHtml: '',

    /**
     * <p>The list of recognised order status used by the Apple US store.</p>
     * @private
     * @type String[]
     */
    status: [
        'We\'ve received your order',
        'Processing Items',
        'Preparing for Shipment',
        'Shipped',
        'Complete'
    ],

    /**
     * <p>The base URL (incl. domain) of the track link on the Apple US store
     * order page.</p>
     * <p>This should be used to find and extract the track URL for a specific
     * order.</p>
     * @private
     * @type String
     */
    trackerUrl: 'https://applestore.bridge-point.com/',

    /**
     * <p>The central manager for updating the orders that are maintained by
     * this extension.</p>
     * <p>This manager can handle concurrent start, stop and restart requests
     * while also supporting repeat (looping) functionality.</p>
     * @namespace
     */
    updateManager: {

        /**
         * <p>The unique interval identifier used to managed repeating
         * updates.</p>
         * @private
         * @type Integer
         */
        id: undefined,

        /**
         * <p>The message stack used by the current update process.</p>
         * <p>Any start/stop/restart requests made while the manager is
         * updating is added to this stack and actioned upon completion of the
         * process. Afterwards, the stack is cleared for the next process.</p>
         * @private
         * @type String[]
         */
        messages: [],

        /**
         * <p>Restarts the update manager which may run once or start a
         * repeating cycle based on the current update frequency.</p>
         * <p>If this is called during an active update process the manager
         * will restart upon completion.</p>
         */
        restart: function () {
            var frequency = utils.get('frequency');
            // I'm busy; I'll do it later
            if (this.updating) {
                this.messages.push('restart');
                return;
            }
            // Clear the current cycle, where applicable
            if (this.id) {
                clearInterval(this.id);
                // Ensure that it is disabled, where applicable
                if (frequency === -1) {
                    this.id = undefined;
                }
            }
            // Start a new cycle if required
            if (frequency !== -1) {
                this.id = setInterval(this.run, frequency);
            }
            // Run the initial process
            this.run();
        },

        /**
         * <p>The core of the update manager which actually performs the update
         * process.</p>
         * <p>This process updates all orders maintained by this extension and
         * ensures the results are reflected in the popup.</p>
         * @private
         */
        run: function () {
            var popup = $(ext.popupHtml),
                progress = 0;
            this.updating = true;
            // Update the UI to show I'm busy
            ext.notify();
            ext.updatePopup();
            /**
             * <p>Called when the AJAX request has been parsed and read for
             * each order.</p>
             * <p>This should be called regardless of errors being
             * encountered.</p>
             * @param {Object} order The order which may have been updated.
             * @ignore
             */
            function updated(order) {
                progress++;
                // Check if all orders have been updated; supports no orders
                if (progress >= ext.orders.length) {
                    this.updating = false;
                    // Persist orders and update time stamp
                    utils.set('orders', ext.orders);
                    utils.set('lastUpdated', $.now());
                    // Update the UI again to reflect the changes
                    ext.notify();
                    ext.updatePopup();
                    // Now read the message stack
                    for (var i = 0; i < this.messages.length; i++) {
                        this[this.messages[i]]();
                    }
                    this.messages = [];
                }
            }
            // Finish this now since no orders exist
            if (!ext.orders.length) {
                updated.apply(this);
            }
            // Update each order by parsing its page on the Apple US store
            for (var i = 0; i < ext.orders.length; i++) {
                ext.updateOrder(ext.orders[i], updated);
            }
        },

        /**
         * <p>Starts the update manager which may run once or start a
         * repeating cycle based on the current update frequency.</p>
         */
        start: function () {
            var frequency = utils.get('frequency');
            // Clear the current cycle, where applicable
            if (frequency === -1) {
                if (this.id) {
                    clearInterval(this.id);
                    this.id = undefined;
                }
            } else {
                // I start twice for no one... see RESTART for that
                if (this.id) {
                    return;
                }
                // Start a new cycle
                this.id = setInterval(this.run, frequency);
            }
            // Run the initial process
            this.run();
        },

        /**
         * <p>Stops the update manager.</p>
         * <p>If this is called during an active update process the manager
         * will stop upon completion.</p>
         */
        stop: function () {
            // I'm busy; I'll do it later
            if (this.updating) {
                this.messages.push('stop');
                return;
            }
            // Clear the current cycle, where possible
            if (this.id) {
                clearInterval(this.id);
                this.id = undefined;
            }
        },

        /**
         * <p>Indicates whether or not the update manager is currently
         * running through an update process.</p>
         * @type Boolean
         */
        updating: false

    },

    /**
     * <p>The number of status updates since the user last cleared it.</p>
     * @type Integer
     */
    updates: 0,

    /**
     * <p>The current version of this extension.</p>
     * @private
     * @type String
     */
    version: '',

    /**
     * <p>Builds the HTML to populate the popup with to optimize popup loading
     * times.</p>
     * @see ext.updatePopup
     * @private
     */
    buildPopup: function () {
        var errors = false,
            footer = $('<footer/>').append($('<div/>'), $('<div/>')),
            header = $('<header/>').append($('<div/>'), $('<div/>')),
            table = $('<table id="orders"/>'),
            tbody = $('<tbody/>');
        // Add the header links (Options, Orders)
        header.find('div:last-child').append(
            $('<a/>', {
                href: '#',
                id: 'optionsLink',
                onclick: 'popup.options()',
                text: chrome.i18n.getMessage('options_text'),
                title: chrome.i18n.getMessage('options_title')
            }), $('<a/>', {
                href: '#',
                id: 'ordersLink',
                onclick: 'popup.viewAll()',
                text: chrome.i18n.getMessage('orders_text'),
                title: chrome.i18n.getMessage('orders_title')
            })
        );
        // Add the refresh button to the footer (can be removed though)
        footer.find('div:first-child').append(
            $('<button/>', {
                id: 'refreshLink',
                onclick: 'popup.refresh()',
                text: chrome.i18n.getMessage('refresh_text'),
                title: chrome.i18n.getMessage('refresh_title')
            })
        );
        // Change the refresh button to show I'm busy... I am you know
        if (ext.updateManager.updating) {
            footer.find('div:first-child button:first-child').attr({
                disabled: 'disabled',
                title: chrome.i18n.getMessage('refreshing_title')
            }).html(chrome.i18n.getMessage('refreshing_text'));
        }
        // Add the clear button if badges are visibile; they can be distracting
        if (ext.updates) {
            footer.find('div:first-child').append(
                $('<button/>', {
                    id: 'clearLink',
                    onclick: 'popup.clear()',
                    text: chrome.i18n.getMessage('clear_text'),
                    title: chrome.i18n.getMessage('clear_title')
                })
            );
        }
        // Add the update details to the footer
        footer.find('div:last-child').append(
            $('<span/>', {
                text: chrome.i18n.getMessage('popup_footer_text', [
                    ext.formatTimeStamp(utils.get('lastUpdated')),
                    ext.getFrequency().text
                ])
            })
        );
        // Add the column headers to the orders table
        table.append(
            $('<thead/>').append(
                $('<tr/>').append(
                    $('<th/>', {
                        text: chrome.i18n.getMessage('order_header')
                    }), $('<th/>', {
                        text: chrome.i18n.getMessage('status_header')
                    }), $('<th/>', {
                        text: chrome.i18n.getMessage('actions_header')
                    })
                )
            )
        );
        // Add the table body which will contain the orders
        table.append(tbody);
        // No orders exist so fill the blank and hide the refresh link
        if (!ext.orders.length) {
            $('<tr/>').append(
                $('<td/>', {
                    'class': 'empty',
                    colspan: 3
                }).append(chrome.i18n.getMessage('no_orders_text'))
            ).appendTo(tbody);
            footer.find('#refreshLink').remove();
        }
        // Otherwise; let's create a row for each order
        for (var i = 0; i < ext.orders.length; i++) {
            $('<tr/>').append(
                $('<td/>').append(
                    $('<strong/>', {
                        text: ext.orders[i].label
                    }),
                    '<br />',
                    $('<a/>', {
                        'data-order-code': ext.orders[i].code,
                        'data-order-number': ext.orders[i].number,
                        href: '#',
                        onclick: 'popup.view(this)',
                        text: ext.orders[i].number,
                        title: chrome.i18n.getMessage('order_title')
                    })
                ),
                $('<td/>').append(
                    $('<span/>', {
                        text: function () {
                            var length = ext.orders[i].updates.length;
                            if (length === 0) {
                                return ' ';
                            }
                            return ext.orders[i].updates[length - 1].status;
                        }
                    })
                )
            ).appendTo(tbody);
            // Order had an error; I suppose I should tell the user
            if (ext.orders[i].error) {
                errors = true;
                tbody.find('tr:last-child td:first-child strong').attr({
                    'class': 'error',
                    title: chrome.i18n.getMessage(ext.orders[i].error)
                });
            }
            // Found the track link so I'll share it with the user
            if (ext.orders[i].trackingUrl) {
                tbody.find('tr:last-child').append(
                    $('<td/>').append(
                        $('<a/>', {
                            'data-order-code': ext.orders[i].code,
                            'data-order-number': ext.orders[i].number,
                            href: '#',
                            onclick: 'popup.track(this)',
                            text: chrome.i18n.getMessage('track_text'),
                            title: chrome.i18n.getMessage('track_title')
                        })
                    )
                );
            } else {
                tbody.find('tr:last-child').append(
                    $('<td/>').append(' ')
                );
            }
        }
        // One or more order has an error so I'll add a little icon
        if (errors) {
            footer.find('div:last-child').prepend(
                $('<img/>', {
                    height: 14,
                    id: 'errorIcon',
                    src: '../images/exclamation_red.png',
                    title: chrome.i18n.getMessage('update_errors_text'),
                    width: 14
                })
            );
        }
        ext.popupHtml = $('<div/>').append(header, table, footer).html();
    },

    /**
     * <p>Formats the given time stamp for display in the popup.</p>
     * <p>The time stamp is formatted as <code>HH:mm</code>.</p>
     * @param {Integer} timeStamp The time stamp to be formatted.
     * @returns {String} The formatted time stamp.
     * @private
     */
    formatTimeStamp: function (timeStamp) {
        var date = new Date(timeStamp),
            str = '';
        str += utils.leftPad(date.getHours(), 2, 0) + ':';
        str += utils.leftPad(date.getMinutes(), 2, 0);
        return str;
    },

    /**
     * <p>Attempts to return the details on the currently persisted
     * frequency.</p>
     * @returns {Object} The matched frequency's details.
     * @see ext.frequencies
     * @private
     */
    getFrequency: function () {
        var frequency = utils.get('frequency');
        for (var i = 0; i < ext.frequencies.length; i++) {
            if (ext.frequencies[i].value === frequency) {
                return ext.frequencies[i];
            }
        }
    },

    /**
     * <p>Attempts to return the order whose details match the specified
     * criteria.</p>
     * @param {String} number The order number.
     * @param {String} code The order's delivery zip/post code.
     * @returns {Object} The matched order.
     */
    getOrder: function (number, code) {
        for (var i = 0; i < ext.orders.length; i++) {
            if (ext.orders[i].number === number &&
                    ext.orders[i].code === code) {
                return ext.orders[i];
            }
        }
    },

    /**
     * <p>Returns the number of status updates detected by this extension for
     * an order since the specified time.</p>
     * @param {Object} order The order whose updates are to be queried.
     * @param {Integer} lastRead The time stamp to count updates from.
     * @returns {Integer} The number of status updates since the time
     * specified.
     * @private
     */
    getOrderStatusUpdates: function (order, lastRead) {
        var updates = 0;
        for (var i = 0; i < order.updates.length; i++) {
            if (order.updates[i].timeStamp > lastRead) {
                updates++;
            }
        }
        return updates;
    },

    /**
     * <p>Returns the URL of the page on the Apple US store for the specified
     * order.</p>
     * @param {Object} order The order whose URL is required.
     * @returns {String} The URL of the order's page.
     * @see ext.orderUrl
     * @private
     */
    getOrderUrl: function (order) {
        return ext.orderUrl + encodeURIComponent(order.number) + '/' +
            encodeURIComponent(order.code);
    },

    /**
     * <p>Returns the total number of status updates detected by this extension
     * for all existing orders since the last time badges were cleared.</p>
     * @returns {Integer} The total number of status updates since badges were
     * last cleared.
     * @private
     */
    getStatusUpdates: function () {
        var lastRead = utils.get('lastRead'),
            updates = 0;
        for (var i = 0; i < ext.orders.length; i++) {
            updates += ext.getOrderStatusUpdates(ext.orders[i], lastRead);
        }
        return updates;
    },

    /**
     * <p>Returns all windows managed by this extension that are displaying a
     * page that begins with the specified URL.</p>
     * @param {String} url The base URL of the desired windows.
     * @returns {DOMWindow[]} A list of matched windows.
     * @private
     */
    getWindows: function (url) {
        return chrome.extension.getViews({
            type: 'tab'
        }).filter(function (element) {
            return element.location.href.indexOf(url) === 0;
        });
    },

    /**
     * <p>Indicates whether or not any orders contain errors.</p>
     * @returns {Boolean} <code>true</code> if one or more orders have an
     * error; otherwise <code>false</code>.
     */
    hasErrors: function () {
        var errors = false;
        for (var i = 0; i < ext.orders.length; i++) {
            if (ext.orders[i].error) {
                errors = true;
                break;
            }
        }
        return errors;
    },

    /**
     * <p>Initializes the background page.</p>
     * <p>This involves initializing the settings, adding the request
     * listeners and starting the update manager.</p>
     */
    init: function () {
        utils.init('badges', true);
        utils.init('frequency', ext.frequencies[1].value);
        utils.init('lastRead', $.now());
        utils.init('lastUpdated', $.now());
        utils.init('notifications', true);
        utils.init('notificationDuration', 6 * 1000);
        ext.initOrders();
        chrome.extension.onRequest.addListener(ext.onRequest);
        // It's nice knowing what version is running
        $.getJSON(chrome.extension.getURL('manifest.json'), function (data) {
            ext.version = data.version;
        });
        // It's alive!
        ext.updateManager.start();
    },

    /**
     * <p>Initializes the persisted managed orders.</p>
     * @private
     */
    initOrders: function () {
        utils.init('orders', []);
        ext.orders = utils.get('orders');
    },

    /**
     * <p>Indicates whether or not an order already has the specified
     * status.</p>
     * @param {Object} order The order to be queried.
     * @param {String} status The status to be checked.
     * @returns {Boolean} <code>true</code> if the status has not previously
     * been detected for the order; otherwise <code>false</code>.
     * @private
     */
    isOrderStatusNew: function (order, status) {
        for (var i = 0; i < order.updates.length; i++) {
            if (order.updates[i].status === status) {
                return false;
            }
        }
        return true;
    },

    /**
     * <p>Indicates whether or not the specified status is recognised by this
     * extension.</p>
     * @param {String} status The status to be checked.
     * @returns {Boolean} <code>true</code> if the status is recognised;
     * otherwise <code>false</code>.
     * @see ext.status
     * @private
     */
    isValidOrderStatus: function (status) {
        for (var i = 0; i < ext.status.length; i++) {
            if (ext.status[i] === status) {
                return true;
            }
        }
        return false;
    },

    /**
     * <p>Ensures any badge notification is cleared.</p>
     * @param {Boolean} [retainTimeStamp=false] <code>true</code> to avoid
     * updating the persisted <code>lastRead</code> time stamp; otherwise
     * <code>false</code>.
     * @private
     */
    markRead: function (retainTimeStamp) {
        ext.updates = 0;
        if (!retainTimeStamp) {
            utils.set('lastRead', $.now());
        }
        ext.setBadge();
        // Update the UI so the clear button vanishes
        ext.updatePopup();
    },

    /**
     * <p>Attempts to notify the user of any unread status updates.</p>
     * <p>If there are no status updates any visible badge will be removed.</p>
     * @private
     */
    notify: function () {
        var oldUpdates = ext.updates;
        ext.updates = ext.getStatusUpdates();
        // Update/clear badge depending on setting and updates available
        if (utils.get('badges')) {
            ext.setBadge(ext.updates || '');
        } else {
            ext.setBadge();
        }
        // Show the notification if setting enabled and has new updates
        if (utils.get('notifications') && ext.updates > oldUpdates) {
            webkitNotifications.createHTMLNotification(
                chrome.extension.getURL('pages/notification.html')
            ).show();
        }
    },

    /**
     * <p>Listener for internal requests to the extension.</p>
     * <p>This function will handle the request based on its type and the data
     * provided.</p>
     * @param {Object} request The request sent by the calling script.
     * @param {Object} request.data The data for the request to be handled.
     * @param {String} request.type The type of request being made.
     * @param {MessageSender} [sender] An object containing information about
     * the script context that sent a message or request.
     * @param {Function} [sendResponse] Function to call when you have a
     * response. The argument should be any JSON-ifiable object, or undefined
     * if there is no response.
     * @private
     */
    onRequest: function (request, sender, sendResponse) {
        var order = {}, url = '', windows = [];
        // Check what needs to be done... and then do it
        switch (request.type) {
        case 'clear':
            ext.markRead();
            break;
        case 'options':
            // Try using existing tabs for the options page before creating one
            url = chrome.extension.getURL('pages/options.html');
            ext.selectOrCreateTab(url, function (isNew) {
                if (!isNew) {
                    windows = ext.getWindows(url);
                    for (var i = 0; i < windows.length; i++) {
                        windows[i].options.refresh();
                    }
                }
            });
            break;
        case 'refresh':
            ext.updateManager.restart();
            break;
        case 'track':
            order = ext.getOrder(request.data.number, request.data.code);
            if (order && order.trackingUrl) {
                chrome.tabs.create({
                    url: order.trackingUrl
                });
            }
            break;
        case 'viewAll':
            chrome.tabs.create({
                url: ext.ordersUrl
            });
            break;
        case 'view':
            order = ext.getOrder(request.data.number, request.data.code);
            if (order) {
                chrome.tabs.create({
                    url: ext.getOrderUrl(order)
                });
            }
            break;
        }
    },

    /**
     * <p>Attempts to select a tab in the current window displaying a page
     * whose location begins with the specified URL.</p>
     * <p>If no existing tab exists a new one is simply created.</p>
     * @param {String} url The URL in need of a tab to call home.
     * @param {Function} [callback] Function to call once a tab is
     * selected/created which is passed a single <code>Boolean</code> argument
     * indicating whether or not a new tab was created.
     * @private
     */
    selectOrCreateTab: function (url, callback) {
        chrome.tabs.getAllInWindow(null, function (tabs) {
            var tab;
            // Try to find an existing tab
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i].url.indexOf(url) === 0) {
                    tab = tabs[i];
                    break;
                }
            }
            if (tab) {
                // Found one! Now to select it
                chrome.tabs.update(tab.id, {
                    selected: true
                });
                if (callback) {
                    callback(false);
                }
            } else {
                // Ach well, let's just create a new one
                chrome.tabs.create({
                    url: url
                });
                if (callback) {
                    callback(true);
                }
            }
        });
    },

    /**
     * <p>Sets the badge text to the specified <code>String</code>.</p>
     * <p>If no <code>String</code> is specified the badge is cleared.</p>
     * @param {String} [str=""] The <code>String</code> to be displayed.
     * @private
     */
    setBadge: function (str) {
        if (typeof str === 'undefined') {
            str = '';
        }
        chrome.browserAction.setBadgeText({text: String(str)});
    },

    /**
     * <p>Sends an AJAX request to the specified order's page on the Apple US
     * store and parses the response to update the order's properties.</p>
     * <p>If an <em>error</em> occurs during the update a short description
     * will be assigned to <code>order.error</code>.</p>
     * @param {Object} order The order to be updated.
     * @param {Function} callback Function to be called when once the AJAX
     * response has been handled. The order is passed in to this function as
     * the only argument.
     * @private
     */
    updateOrder: function (order, callback) {
        $.get(ext.getOrderUrl(order), function (data) {
            // Probably won't happen; more of a sanity check
            if (!data) {
                order.error = 'update_invalid_page_error';
                return;
            }
            // Extract the relevant elements wrapped in jQuery goodness
            var heading = $(data).find('.order .delivery-group .sb-heading'),
                status = heading.find('h4 span:first-child'),
                trackingUrl = heading.find('.group-actions tr:first-child ' +
                    'td:first-child a[href^="' + ext.trackerUrl + '"]');
            // Dig deeper and try and get the actual values
            status = (status.length) ? status.text() : '';
            trackingUrl = (trackingUrl.length) ? trackingUrl.attr('href') : '';
            if (status) {
                // A possible status was found but is it valid?
                if (ext.isValidOrderStatus(status)) {
                    // OK, it was valid; but is it new???
                    if (ext.isOrderStatusNew(order, status)) {
                        // Right! It was valid and new! Just add it already
                        order.updates.push({
                            status: status,
                            timeStamp: $.now()
                        });
                    }
                } else {
                    // Extension could need updated if it gets here
                    order.error = 'update_invalid_status_error';
                    return;
                }
            } else {
                // Bad user data or extension could need updated
                order.error = 'update_status_not_found_error';
                return;
            }
            order.trackingUrl = trackingUrl;
            // Clear any pre-existing errors
            order.error = '';
        }).error(function () {
            // Something went wrong
            order.error = 'update_page_not_found_error';
        }).complete(function () {
            // Done! Now let's tell the boss
            callback.apply(ext.updateManager, [order]);
        });
    },

    /**
     * <p>Builds the HTML to populate the popup with to optimize popup loading
     * times and updates any popup currently being displayed.</p>
     * @see ext.buildPopup
     * @private
     */
    updatePopup: function() {
        var popup = chrome.extension.getViews({type: 'popup'})[0];
        ext.buildPopup();
        if (popup) {
            popup.document.body.innerHTML = ext.popupHtml;
        }
    }

};
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

var ext = {

    badgeCount: 0,

    frequencies: [{
        text: 'Disabled', // TODO: i18n
        value: -1
    }, {
        text: '5 minutes', // TODO: i18n
        value: 5 * 60 * 1000
    }, {
        text: '10 minutes', // TODO: i18n
        value: 10 * 60 * 1000
    }, {
        text: '15 minutes', // TODO: i18n
        value: 15 * 60 * 1000
    }, {
        text: '30 minutes', // TODO: i18n
        value: 30 * 60 * 1000
    }, {
        text: '1 hour', // TODO: i18n
        value: 60 * 60 * 1000
    }, {
        text: '2 hours', // TODO: i18n
        value: 2 * 60 * 60 * 1000
    }],

    orderUrl: 'https://store.apple.com/us/order/guest/',

    orders: [],

    ordersUrl: 'https://store.apple.com/us/order/list',

    popupHtml: '',

    status: [
        'We\'ve received your order',
        'Processing Items',
        'Preparing for Shipment',
        'Shipped',
        'Complete'
    ],

    trackerUrl: 'https://applestore.bridge-point.com/',

    updateManager: undefined,

    version: '',

    buildPopup: function () {
        var footer = $('<footer/>').append($('<div/>'), $('<div/>')),
            header = $('<header/>').append($('<div/>')),
            table = $('<table id="orders"/>');
        header.find('div').append($('<a/>', {
            href: '#',
            id: 'optionsLink',
            onclick: 'popup.options()',
            text: 'Options' // TODO: i18n
        }), $('<a/>', {
            href: '#',
            id: 'ordersLink',
            onclick: 'popup.viewAll()',
            text: 'Orders' // TODO: i18n
        }));
        footer.find('div:first-child').append($('<a/>', {
            href: '#',
            id: 'refreshLink',
            onclick: 'popup.refresh()',
            text: 'Refresh' // TODO: i18n
        }));
        if (ext.badgeCount) {
            footer.find('div:first-child').append($('<a/>', {
                href: '#',
                id: 'flushLink',
                onclick: 'popup.flush()',
                text: 'Flush' // TODO: i18n
            }));
        }
        footer.find('div:last-child').append($('<span/>', {
            text: function () {
                var str = 'Updated: '; // TODO: i18n
                str += new Date(utils.get('lastUpdated')).toLocaleTimeString();
                str += ' - Frequency: ' + ext.getFrequency().text; // TODO: i18n
                return str;
            }
        })); // TODO: Actual code
        table.append($('<tr/>').append($('<th/>', {
            text: 'Order' // TODO: i18n
        }), $('<th/>', {
            text: 'Status' // TODO: i18n
        }), $('<th/>', {
            text: 'Actions' // TODO: i18n
        })));
        for (var i = 0; i < ext.orders.length; i++) {
            $('<tr/>').append(
                $('<td/>').append($('<a/>', {
                    'data-order': ext.orders[i].number,
                    href: '#',
                    onclick: 'popup.view(this)',
                    text: ext.orders[i].number
                })),
                $('<td/>').append($('<span/>', {
                    text: function () {
                        var length = ext.orders[i].updates.length;
                        if (length === 0) {
                            return 'N/A'; // TODO: i18n?
                        }
                        return ext.orders[i].updates[length - 1].status;
                    }
                }))
            ).appendTo(table);
            if (ext.orders[i].trackingUrl) {
                table.find('tr:last-child').append($('<td/>').append($('<a/>', {
                    'data-order': ext.orders[i].number,
                    href: '#',
                    onclick: 'popup.track(this)',
                    text: 'Track' // TODO: i18n
                })));
            }
        }
        ext.popupHtml = $('<div/>').append(header, table, footer).html();
    },

    getFrequency: function () {
        var frequency = utils.get('frequency');
        for (var i = 0; i < ext.frequencies.length; i++) {
            if (ext.frequencies[i].value === frequency) {
                return ext.frequencies[i];
            }
        }
    },

    getOrder: function (number) {
        for (var i = 0; i < ext.orders.length; i++) {
            if (ext.orders[i].number === number) {
                return ext.orders[i];
            }
        }
    },

    getOrderStatusUpdates: function (order, lastRead) {
        var updates = 0;
        for (var i = 0; i < order.updates.length; i++) {
            if (order.updates[i].timeStamp > lastRead) {
                updates++;
            }
        }
        return updates;
    },

    getOrderUrl: function (order) {
        return ext.orderUrl + order.number + '/' + encodeURIComponent(order.code);
    },

    getStatusUpdates: function () {
        var lastRead = utils.get('lastRead'),
            updates = 0;
        for (var i = 0; i < ext.orders.length; i++) {
            updates += ext.getOrderStatusUpdates(ext.orders[i], lastRead);
        }
        return updates;
    },

    init: function () {
        utils.init('frequency', ext.frequencies[1].value);
        utils.init('lastRead', $.now());
        utils.init('lastUpdated', $.now());
        ext.initOrders();
        chrome.extension.onRequest.addListener(ext.onRequest);
        // Derives extension's version
        $.getJSON(chrome.extension.getURL('manifest.json'), function (data) {
            ext.version = data.version;
        });
        ext.showBadge();
        ext.buildPopup();
        ext.startUpdateManager();
    },

    initOrders: function () {
        // TODO: ext.orders = utils.get('orders');
        ext.orders = [{
            code: 'KY12 7TR',
            errors: false,
            number: 'W246106987',
            trackingUrl: '',
            updates: []
        }]; // TODO: Remove
        console.log('fetched orders'); // TODO: Remove
    },

    isOrderNumberNew: function (number) {
        for (var i = 0; i < ext.orders.length; i++) {
            if (ext.orders[i].number === number) {
                return false;
            }
        }
        return true;
    },

    isOrderStatusNew: function (order, status) {
        for (var i = 0; i < order.updates.length; i++) {
            if (order.updates[i].status === status) {
                return false;
            }
        }
        return true;
    },

    isValidOrderStatus: function (status) {
        for (var i = 0; i < ext.status.length; i++) {
            if (ext.status[i] === status) {
                return true;
            }
        }
        return false;
    },

    markRead: function () {
        ext.badgeCount = 0;
        utils.set('lastRead', $.now());
        chrome.browserAction.setBadgeText({text: ''});
        ext.popupHtml = $('<div/>').append($(ext.popupHtml).remove(
                '#flushLink')).html();
    },

    onRequest: function (request, sender, sendResponse) {
        var order = {};
        switch (request.type) {
        case 'flush':
            ext.markRead();
            break;
        case 'options':
            chrome.tabs.create({
                url: chrome.extension.getURL('pages/options.html')
            });
            break;
        case 'refresh':
            ext.refresh();
            break;
        case 'track':
            order = ext.getOrder(request.data.order);
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
        default:
            order = ext.getOrder(request.data.order);
            if (order) {
                chrome.tabs.create({
                    url: ext.getOrderUrl(order)
                });
            }
        }
    },

    refresh: function () {
        ext.updateManager.restart();
    },

    showBadge: function () {
        var str = '';
        ext.badgeCount = ext.getStatusUpdates();
        chrome.browserAction.setBadgeText({
            text: str + (ext.badgeCount || '')
        });
    },

    startUpdateManager: function () {
        // TODO: Fix it! It keeps updating too quickly! Why?!?!?!?
        if (!ext.updateManager) {
            ext.updateManager = {
                id: undefined,
                messages: [],
                restart: function () {
                    var frequency = utils.get('frequency');
                    if (this.updating) {
                        this.messages.push('restart');
                        return;
                    }
                    if (this.id) {
                        clearInterval(this.id);
                        if (frequency === -1) {
                            this.id = undefined;
                        }
                    }
                    if (frequency !== -1) {
                        this.id = setInterval(this.run, frequency);
                    }
                    this.run();
                },
                run: function () {
                    this.updating = true;
                    ext.updateAll(function () {
                        this.updating = false;
                        for (var i = 0; i < this.messages.length; i++) {
                            this[this.messages[i]]();
                        }
                        this.messages = [];
                    });
                },
                start: function () {
                    var frequency = utils.get('frequency');
                    if (frequency === -1) {
                        if (this.id) {
                            clearInterval(this.id);
                            this.id = undefined;
                        }
                    } else {
                        if (this.id) {
                            return;
                        }
                        this.id = setInterval(this.run, frequency);
                    }
                    this.run();
                },
                stop: function () {
                    if (this.updating) {
                        this.messages.push('stop');
                        return;
                    }
                    if (this.id) {
                        clearInterval(this.id);
                        this.id = undefined;
                    }
                },
                updating: false
            }
        }
        ext.updateManager.start();
    },

    update: function (order, callback) {
        $.get(ext.getOrderUrl(order), function (data) {
            if (!data) {
                callback(order);
                return;
            }
            var heading = $(data).find('.order .delivery-group .sb-heading'),
                status = heading.find('h4 span:first-child'),
                trackingUrl = heading.find('.group-actions tr:first-child td:first-child a[href^="' + ext.trackerUrl + '"]');
            status = (status.length) ? status.text() : '';
            trackingUrl = (trackingUrl.length) ? trackingUrl.attr('href') : '';
            if (status && ext.isValidOrderStatus(status) && ext.isOrderStatusNew(order, status)) {
                order.updates.push({
                    status: status,
                    timeStamp: $.now()
                });
            }
            order.trackingUrl = trackingUrl;
        }).complete(function () {
            callback(order);
        });
    },

    updateAll: function (callback) {
        var updateCount = 0;
        function updated(order) {
            updateCount++;
            if (updateCount === ext.orders.length) {
                // TODO: utils.set('orders', ext.orders);
                console.log('stored orders'); // TODO: Remove
                utils.set('lastUpdated', $.now());
                ext.showBadge();
                ext.buildPopup();
                callback.apply(ext.updateManager);
            }
        }
        for (var i = 0; i < ext.orders.length; i++) {
            ext.update(ext.orders[i], updated);
        }
    }

};
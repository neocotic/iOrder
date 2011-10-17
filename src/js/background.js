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

    updateManager: {
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
            var popup = $(ext.popupHtml),
                progress = 0;
            this.updating = true;
            popup.find('footer div:first-child button:first-child').attr({
                disabled: 'disabled',
                title: chrome.i18n.getMessage('refreshing_title')
            }).html(chrome.i18n.getMessage('refreshing_text'));
            ext.popupHtml = $('<div/>').append(popup).html();
            function updated(order) {
                progress++;
                if (progress === ext.orders.length) {
                    this.updating = false;
                    utils.set('orders', ext.orders);
                    utils.set('lastUpdated', $.now());
                    ext.showBadge();
                    ext.buildPopup();
                    // Handles message stack
                    for (var i = 0; i < this.messages.length; i++) {
                        this[this.messages[i]]();
                    }
                    this.messages = [];
                }
            }
            for (var i = 0; i < ext.orders.length; i++) {
                ext.update(ext.orders[i], updated);
            }
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
    },

    version: '',

    buildPopup: function () {
        var footer = $('<footer/>').append($('<div/>'), $('<div/>')),
            header = $('<header/>').append($('<div/>'), $('<div/>')),
            table = $('<table id="orders"/>'),
            tbody = $('<tbody/>');
        header.find('div:last-child').append($('<a/>', {
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
        }));
        footer.find('div:first-child').append($('<button/>', {
            id: 'refreshLink',
            onclick: 'popup.refresh()',
            text: chrome.i18n.getMessage('refresh_text'),
            title: chrome.i18n.getMessage('refresh_title')
        }));
        if (ext.updateManager.updating) {
            footer.find('div:first-child button:first-child').attr({
                disabled: 'disabled',
                title: chrome.i18n.getMessage('refreshing_title')
            }).html(chrome.i18n.getMessage('refreshing_text'));
        }
        if (ext.badgeCount) {
            footer.find('div:first-child').append($('<button/>', {
                id: 'clearLink',
                onclick: 'popup.clear()',
                text: chrome.i18n.getMessage('clear_text'),
                title: chrome.i18n.getMessage('clear_title')
            }));
        }
        footer.find('div:last-child').append($('<span/>', {
            text: chrome.i18n.getMessage('popup_footer_text', [
                ext.formatTimeStamp(utils.get('lastUpdated')),
                ext.getFrequency().text
            ])
        }));
        table.append($('<thead/>').append($('<tr/>').append($('<th/>', {
            text: chrome.i18n.getMessage('order_header')
        }), $('<th/>', {
            text: chrome.i18n.getMessage('status_header')
        }), $('<th/>', {
            text: chrome.i18n.getMessage('actions_header')
        }))));
        table.append(tbody);
        for (var i = 0; i < ext.orders.length; i++) {
            $('<tr/>').append(
                $('<td/>').append($('<strong/>', {
                    text: ext.orders[i].label
                }), '<br />', $('<a/>', {
                    'data-order': ext.orders[i].number,
                    href: '#',
                    onclick: 'popup.view(this)',
                    text: ext.orders[i].number,
                    title: chrome.i18n.getMessage('order_title')
                })),
                $('<td/>').append($('<span/>', {
                    text: function () {
                        var length = ext.orders[i].updates.length;
                        if (length === 0) {
                            return chrome.i18n.getMessage('loading');
                        }
                        return ext.orders[i].updates[length - 1].status;
                    }
                }))
            ).appendTo(tbody);
            if (ext.orders[i].trackingUrl) {
                tbody.find('tr:last-child').append($('<td/>').append($('<a/>', {
                    'data-order': ext.orders[i].number,
                    href: '#',
                    onclick: 'popup.track(this)',
                    text: chrome.i18n.getMessage('track_text'),
                    title: chrome.i18n.getMessage('track_title')
                })));
            } else {
                tbody.find('tr:last-child').append($('<td/>').append(chrome.i18n.getMessage('loading')));
            }
        }
        ext.popupHtml = $('<div/>').append(header, table, footer).html();
    },

    formatTimeStamp: function (timeStamp) {
        var date = new Date(timeStamp),
            str = '';
        str += ext.leftPad(date.getHours(), 2, 0) + ':';
        str += ext.leftPad(date.getMinutes(), 2, 0);
        return str;
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
        ext.updateManager.start();
    },

    initOrders: function () {
        utils.init('orders', []);
        ext.orders = utils.get('orders');
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

    leftPad: function (str, size, padStr) {
        if (typeof padStr === 'undefined') {
            padStr = ' ';
        } else {
            padStr = String(padStr);
        }
        if (str === null) {
            return str;
        }
        str = String(str);
        var pads = size - str.length;
        if (pads <= 0) {
            return str;
        }
        for (var i = 0; i < pads; i++) {
            str = padStr + str;
        }
        return str;
    },

    markRead: function () {
        ext.badgeCount = 0;
        utils.set('lastRead', $.now());
        chrome.browserAction.setBadgeText({text: ''});
        var popup = $(ext.popupHtml);
        popup.find('#clearLink').remove();
        ext.popupHtml = $('<div/>').append(popup).html();
    },

    onRequest: function (request, sender, sendResponse) {
        var order = {};
        switch (request.type) {
        case 'clear':
            ext.markRead();
            break;
        case 'options':
            ext.selectOrCreateTab(chrome.extension.getURL('pages/options.html'));
            break;
        case 'refresh':
            ext.updateManager.restart();
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

    selectOrCreateTab: function (url) {
        chrome.tabs.getAllInWindow(null, function (tabs) {
            var tab;
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i].url.indexOf(url) === 0) {
                    tab = tabs[i];
                    break;
                }
            }
            if (tab) {
                chrome.tabs.update(tab.id, {
                    selected: true
                });
            } else {
                chrome.tabs.create({
                    url: url
                });
            }
        });
    },

    showBadge: function () {
        var str = '';
        ext.badgeCount = ext.getStatusUpdates();
        chrome.browserAction.setBadgeText({
            text: str + (ext.badgeCount || '')
        });
    },

    update: function (order, callback) {
        $.get(ext.getOrderUrl(order), function (data) {
            if (!data) {
                callback.apply(ext.updateManager, [order]);
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
            callback.apply(ext.updateManager, [order]);
        });
    }

};
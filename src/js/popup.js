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

var ext = chrome.extension.getBackgroundPage().ext,
    popup = {

    optionsTabSuffix: '_nav',

    clear: function () {
        popup.sendRequest('clear');
    },

    init: function () {
        document.body.innerHTML = ext.popupHtml;
    },

    options: function (tab) {
        var suffix = popup.optionsTabSuffix;
        if (tab) {
            if (tab.indexOf(suffix) !== tab.length - suffix.length) {
                tab += suffix;
            }
            utils.set('options_active_tab', tab);
        }
        popup.sendRequest('options', true);
    },

    refresh: function () {
        popup.sendRequest('refresh');
    },

    sendRequest: function (type, closeAfter, data, element) {
        data = data || {};
        if (element) {
            data.code = element.getAttribute('data-order-code');
            data.number = element.getAttribute('data-order-number');
        }
        chrome.extension.sendRequest({
            data: data,
            type: type
        });
        if (closeAfter) {
            window.close();
        }
    },

    track: function (element) {
        popup.sendRequest('track', true, {}, element);
    },

    view: function (element) {
        popup.sendRequest('view', true, {}, element);
    },

    viewAll: function () {
        popup.sendRequest('viewAll', true);
    }

};
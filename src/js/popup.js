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

    clear: function () {
        popup.sendRequest('clear');
    },

    init: function () {
        document.body.innerHTML = ext.popupHtml;
    },

    options: function () {
        popup.sendRequest('options');
    },

    refresh: function () {
        popup.sendRequest('refresh');
    },

    sendRequest: function (type, data, element) {
        data = data || {};
        if (element) {
            data.order = element.getAttribute('data-order');
        }
        chrome.extension.sendRequest({
            data: data,
            type: type
        });
        window.close();
    },

    track: function (element) {
        popup.sendRequest('track', {}, element);
    },

    view: function (element) {
        popup.sendRequest('view', {}, element);
    },

    viewAll: function () {
        popup.sendRequest('viewAll');
    },

};
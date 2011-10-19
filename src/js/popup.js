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
 * <p>Easily accessible reference to the extension controller.</p>
 * @ignore
 */
var ext = chrome.extension.getBackgroundPage().ext;

/**
 * <p>Responsible for the popup page.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 1.0.0
 * @namespace
 */
var popup = {

    /**
     * <p>The suffix of tab declarations used on the options page.</p>
     * @private
     * @type String
     */
    optionsTabSuffix: '_nav',

    /**
     * <p>Sends a request to clear any displayed badge.</p>
     * @event
     */
    clear: function () {
        popup.sendRequest('clear');
    },

    /**
     * <p>Initializes the popup page.</p>
     * <p>This involves inserting the HTML prepared by the background
     * page.</p>
     * @event
     */
    init: function () {
        // Insert the prepared HTML in to the popup's body
        document.body.innerHTML = ext.popupHtml;
    },

    /**
     * <p>Sends a request to open the orders tab on the options page.</p>
     * @param {String} tab
     * @event
     */
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

    /**
     * <p>Sends a request to update the orders immediately.</p>
     * @event
     */
    refresh: function () {
        popup.sendRequest('refresh');
    },

    /**
     * <p>Sends a request to the background page for using the information
     * provided.</p>
     * @param {String} type The type of request to be sent.
     * @param {Boolean} [closeAfter=false] <code>true</code> to close the popup
     * after the request has been sent; otherwise <code>false</code>.
     * @param {Object} [data] The request data to be sent.
     * @param {Element} [element] The element from which to extract related
     * order information and append to the request data.
     * @private
     */
    sendRequest: function (type, closeAfter, data, element) {
        data = data || {};
        // Extract the related order data from the element, where possible
        if (element) {
            data.code = element.getAttribute('data-order-code');
            data.number = element.getAttribute('data-order-number');
        }
        // Send the request to the background page
        chrome.extension.sendRequest({
            data: data,
            type: type
        });
        // Close this pesky popup
        if (closeAfter) {
            window.close();
        }
    },

    /**
     * <p>Sends a request to open the tracking page for the order relating to
     * the clicked link.</p>
     * @param {Element} element The element clicked.
     * @event
     */
    track: function (element) {
        popup.sendRequest('track', true, {}, element);
    },

    /**
     * <p>Sends a request to open the page on the Apple US store for the order
     * relating to the clicked link.</p>
     * @param {Element} element The element clicked.
     * @event
     */
    view: function (element) {
        popup.sendRequest('view', true, {}, element);
    },

    /**
     * <p>Sends a request to open the order listing page on the Apple US
     * store.</p>
     * @event
     */
    viewAll: function () {
        popup.sendRequest('viewAll', true);
    }

};
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
 * <p>Responsible for the notification page.</p>
 * @author <a href="http://github.com/neocotic">Alasdair Mercer</a>
 * @since 1.0.0
 * @namespace
 */
var notification = {

    /**
     * <p>Initializes the notification page.</p>
     * <p>This involves inserting internationalized <code>Strings</code>.</p>
     * @event
     */
    init: function () {
        var duration = utils.get('notificationDuration');
        document.body.innerHTML = chrome.i18n.getMessage('notification');
        /*
         * Sets a timer to close the notification after if user enabled option;
         * otherwise stays open until closed manually by user.
         */
        if (duration > 0) {
            window.setTimeout(function () {
                window.close();
            }, duration);
        }
    }

};
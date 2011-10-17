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
    options = {

    deriveOrder: function (optGrp) {
        var opt = optGrp.find('option'),
            existingOrder,
            order;
        if (optGrp.length && opt.length) {
            order = {
                code: opt.data('code'),
                label: opt.text(),
                number: optGrp.attr('label'),
                trackingUrl: '',
                updates: []
            };
            existingOrder = ext.getOrder(order.number);
            if (existingOrder) {
                order.trackingUrl = existingOrder.trackingUrl;
                order.updates = existingOrder.updates;
            }
        }
        return order;
    },

    formatTimeStamp: function (timeStamp) {
        var date = new Date(timeStamp),
            str = '';
        str += ext.leftPad(date.getDate(), 2, 0) + '/';
        str += ext.leftPad(date.getMonth() + 1, 2, 0) + '/';
        str += date.getFullYear() + ' @ ';
        str += ext.leftPad(date.getHours(), 2, 0) + ':';
        str += ext.leftPad(date.getMinutes(), 2, 0) + ':';
        str += ext.leftPad(date.getSeconds(), 2, 0);
        return str;
    },

    i18nAttribute: function (selector, attribute, name, sub) {
        if (typeof sub === 'string') {
            sub = [sub];
        }
        return $(selector).attr(attribute, chrome.i18n.getMessage(name, sub));
    },

    i18nReplace: function (selector, name, sub) {
        if (typeof sub === 'string') {
            sub = [sub];
        }
        return $(selector).html(chrome.i18n.getMessage(name, sub));
    },

    init: function () {
        // Inserts localized Strings
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
        options.i18nReplace('.save-btn', 'opt_save_button');
        options.i18nReplace('#footer', 'opt_footer',
                String(new Date().getFullYear()));
        // Inserts localized help/confirmation sections
        // TODO: Help sections
        options.i18nReplace('#delete_con', 'confirm_delete');
        // Binds tab selection event to tabs
        $('#navigation li').click(function (event) {
            var $this = $(this);
            if (!$this.hasClass('selected')) {
                $this.siblings().removeClass('selected');
                $this.addClass('selected');
                $($this.attr('data-href')).show().siblings('.tab').hide();
                utils.set('options_active_tab', $this.attr('id'));
            }
        });
        // Reflects persisted tab
        utils.init('options_active_tab', 'general_nav');
        $('#' + utils.get('options_active_tab')).click();
        // Binds options:saveAndClose event to button
        $('.save-btn').click(options.saveAndClose);
        // Loads current option values
        options.load();
        // Initialize facebox
        $('a[rel*=facebox]').facebox();
    },

    load: function () {
        options.loadFrequencies();
        options.loadOrders();
    },

    loadFrequencies: function () {
        var frequency = $('#frequency');
        for (var i = 0; i < ext.frequencies.length; i++) {
            frequency.append($('<option/>', {
                text: ext.frequencies[i].text,
                value: ext.frequencies[i].value
            }));
        }
        frequency.find('option[value="' + utils.get('frequency') + '"]').attr('selected', 'selected');
    },

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
            if (lastSelectedOrder.length) {
                options.updateOrder(lastSelectedOrder.parent('optgroup'));
            }
            // Disables all the controls as no option is selected
            if (opt.length === 0) {
                lastSelectedOrder = {};
                options.i18nReplace('#add_btn', 'opt_add_button');
                $('.read-only, .read-only-always').removeAttr('disabled');
                $('.read-only, .read-only-always').removeAttr('readonly');
                $('#delete_btn').attr('disabled', 'disabled');
                $('#order_code').val('');
                $('#order_label').val('');
                $('#order_number').val('');
                updates.find('optgroup').remove();
            } else {
                lastSelectedOrder = opt;
                options.i18nReplace('#add_btn', 'opt_add_new_button');
                $('.read-only-always').attr('disabled', 'disabled');
                $('.read-only-always').attr('readonly', 'readonly');
                // Updates fields and controls to reflect selected order
                $('#order_code').val(opt.data('code'));
                $('#order_label').val(opt.text());
                $('#order_number').val(optGrp.attr('label'));
                var orderUpdates = JSON.parse(opt.data('updates'));
                for (var i = 0; i < orderUpdates.length; i++) {
                    updates.append($('<optgroup/>', {
                        label: options.formatTimeStamp(orderUpdates[i].timeStamp)
                    }).append($('<option/>', {
                        text: orderUpdates[i].status
                    })));
                }
                $('.read-only').removeAttr('disabled');
                $('.read-only').removeAttr('readonly');
            }
        }).change();
        // Adds a new order to options based on the input values
        $('#add_btn').click(function (event) {
            var opt = orders.find('option:selected'),
                optGrp = opt.parent('optgroup');
            if (optGrp.length && opt.length) {
                orders.val([]).change();
                $('#order_label').focus();
            } else {
                $('#errors').find('li').remove();
                optGrp = options.loadOrder({
                    code: $('#order_code').val().trim().toUpperCase(),
                    label: $('#order_label').val().trim(),
                    number: $('#order_number').val().trim().toUpperCase(),
                    trackingUrl: '',
                    updates: []
                });
                if (options.validateOrder(optGrp)) {
                    orders.append(optGrp);
                    opt.attr('selected', 'selected');
                    orders.change().focus();
                } else {
                    $.facebox({div: '#message'});
                }
            }
        });
        // Prompts user to confirm removal of selected order
        $('#delete_btn').click(function (event) {
            $.facebox({div: '#delete_con'});
        });
        // Cancels order removal process
        $('.delete_no_btn').live('click', function (event) {
            $(document).trigger('close.facebox');
        });
        // Finalizes order removal
        $('.delete_yes_btn').live('click', function (event) {
            var optGrp = orders.find('option:selected').parent('optgroup');
            optGrp.remove();
            orders.change().focus();
            $(document).trigger('close.facebox');
        });
    },

    loadOrders: function () {
        var orders = $('#orders');
        // Ensures clean slate
        orders.remove('optgroup');
        // Creates and inserts options representing orders
        for (var i = 0; i < ext.orders.length; i++) {
            orders.append(options.loadOrder(ext.orders[i]));
        }
        // Loads all event handlers required for managing orders
        options.loadOrderControlEvents();
    },

    save: function () {
        // TODO: Ensure update manager is called when frequency is changed OR orders are modified
        options.saveOrders();
        options.saveFrequencies();
    },

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

    saveFrequencies: function () {
        var frequency = $('#frequency option:selected').val(),
            oldFrequency = utils.get('frequency');
        utils.set('frequency', parseInt(frequency, 10));
        // Update manager doesn't need updated as frequency hasn't changed
        if (frequency === oldFrequency) {
            return;
        }
        // Handles update manager status
        if (frequency === -1) {
            if (oldFrequency !== -1) {
                ext.updateManager.stop();
            }
        } else if (oldFrequency === -1) {
            ext.updateManager.start();
        } else {
            ext.updateManager.restart();
        }
    },

    saveOrders: function () {
        var orders = [];
        /*
         * Updates each individual order settings based on their
         * corresponding options.
         */
        $('#orders optgroup').each(function () {
            orders.push(options.deriveOrder($(this)));
        });
        // Ensures orders data reflects the updated settings
        utils.set('orders', orders);
        ext.orders = orders;
        ext.showBadge();
        ext.buildPopup();
    },

    updateOrder: function (optGrp) {
        var opt = optGrp.find('option');
        if (optGrp.length && opt.length) {
            opt.data('code', $('#order_code').val().trim().toUpperCase());
            opt.text($('#order_label').val().trim());
            optGrp.attr('number', $('#order_number').val().trim().toUpperCase());
            return opt;
        }
    },

    validateOrder: function (optGrp) {
        var opt = optGrp.find('option'),
            code = opt.data('code').trim().toUpperCase(),
            errors = $('#errors'),
            label = opt.text().trim(),
            number = optGrp.attr('label').trim().toUpperCase();
        function createError(name) {
            return $('<li/>', {
                html: chrome.i18n.getMessage(name)
            }).appendTo(errors);
        }
        if (label.length === 0) {
            createError('opt_order_label_invalid');
        }
        if (number.length === 0) {
            createError('opt_order_number_invalid');
        }
        if (code.length === 0) {
            createError('opt_order_code_invalid');
        }
        return errors.find('li').length === 0;
    },

    validateOrders: function () {
        var errors = $('#errors'),
            orders = $('#orders optgroup');
        errors.find('li').remove();
        orders.each(function () {
            var $this = $(this);
            if (!options.validateOrder($this)) {
                $this.attr('selected', 'selected');
                $('#orders').change().focus();
                return false;
            }
        });
        return errors.find('li').length === 0;
    }

};
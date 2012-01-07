# [iOrder](http://neocotic.com/iOrder)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

#### Private constants

# Domain of this extension's homepage.
HOMEPAGE_DOMAIN = 'neocotic.com'
# Base URL (incl. domain and path) of order pages on the Apple US store.  
# The remaining path segments include the number and delivery zip/post
# code, in that order.
ORDER_URL       = 'https://store.apple.com/us/order/guest/'
# URL of the Apple US store orders list for an account.
ORDERS_URL      = 'https://store.apple.com/us/order/list'
# List of recognised order status used by the Apple US store.
STATUS          = [
                    'We\'ve received your order'
                    'Processing Items'
                    'Preparing for Shipment'
                    'Shipped'
                    'Complete'
                  ]
# Base URL (incl. domain) of the track link on the Apple US store order page.  
# This should be used to find and extract the track URL for a specific order.
TRACKER_URL     = 'https://applestore.bridge-point.com/'

#### Private variables

# Number of status updates since the user last cleared it.
updates = 0
# Current version of iOrder.
version = ''

#### Private functions

# Build the HTML to populate the popup with to optimize popup loading times.
buildPopup = ->
  errors  = no
  footer  = $ '<footer/>'
  footerF = $ '<div/>'
  footerL = $ '<div/>'
  header  = $ '<header/>'
  headerF = $ '<div/>'
  headerL = $ '<div/>'
  table   = $ '<table id="orders"/>'
  tbody   = $ '<tbody/>'
  # Add two empty divs to both the header and footer.
  footer.append footerF, footerL
  header.append headerF, headerL
  # Add the header links (Options, Orders).
  headerL.append(
    $ '<a/>',
      href:    '#'
      id:      'optionsLink'
      onclick: 'popup.options()'
      text:    utils.i18n 'options_text'
      title:   utils.i18n 'options_title'
  )
  headerL.append(
    $ '<a/>',
      href:    '#'
      id:      'ordersLink'
      onclick: 'popup.viewAll()'
      text:    utils.i18n 'orders_text'
      title:   utils.i18n 'orders_title'
  )
  # Add the refresh button to the footer (can be removed though).
  footerF.append(
    $ '<button/>',
      id:      'refreshLink'
      onclick: 'popup.refresh()'
      text:    utils.i18n 'refresh_text'
      title:   utils.i18n 'refresh_title'
  )
  # Change the refresh button to show I'm busy... I am y'know.
  if updateManager.updating
    footerF.find('button:first-child').attr(
      disabled: 'disabled'
      title:    utils.i18n 'refreshing_title'
    ).html(utils.i18n 'refreshing_text')
  # Add the clear button if badges are visibile; they can be distracting.
  if updates
    footerF.append(
      $ '<button/>',
        id:      'clearLink'
        onclick: 'popup.clear()'
        text:    utils.i18n 'clear_text'
        title:   utils.i18n 'clear_title'
    )
  # Add the update details to the footer.
  footerL.append(
    $ '<span/>',
      text: utils.i18n('popup_footer_text', [
        new Date(utils.get 'lastUpdated').format 'H:i'
        getFrequency().text
      ])
  )
  # Add the column headers to the orders table.
  $('<thead/>').append(
    $('<tr/>').append.apply this, [
      $ '<th/>', text: utils.i18n 'order_header'
      $ '<th/>', text: utils.i18n 'status_header'
      $ '<th/>', text: utils.i18n 'actions_header'
    ]
  ).appendTo table
  # Add the table body which will contain the orders.
  table.append tbody
  # No orders exist so fill the blank and hide the refresh link.
  unless ext.orders.length
    $('<tr/>').append(
      $('<td/>',
        class:   'empty'
        colspan: 3
      ).html utils.i18n 'no_orders_text'
    ).appendTo tbody
    footer.find('#refreshLink').remove()
  # Otherwise; let's create a row for each order.
  for order, i in ext.orders
    tbody.append(
      $('<tr/>').append.apply this, [
        $('<td/>').append.apply this, [
          $ '<strong/>', text: order.label
          '<br />'
          $ '<a/>',
            'data-order-code':   order.code
            'data-order-number': order.number
            href:                '#'
            onclick:             'popup.view(this)'
            text:                order.number
            title:               utils.i18n 'order_title'
        ],
        $('<td/>').append $ '<span/>', text: getStatusText i
      ]
    )
    # Order had an error; I suppose I should tell the user.
    if order.error
      errors = yes
      tbody.find('tr:last-child td:first-child strong').attr
        class: 'error'
        title: utils.i18n order.error
    # Found the track link so I'll share it with the user. I'm good like that.
    if order.trackingUrl
      tbody.find('tr:last-child').append(
        $('<td/>').append(
          $ '<a/>',
            'data-order-code':   order.code
            'data-order-number': order.number
            href:                '#'
            onclick:             'popup.track(this)'
            text:                utils.i18n 'track_text'
            title:               utils.i18n 'track_title'
        )
      )
    else
      tbody.find('tr:last-child').append $('<td/>').append ' '
  # One or more order has an error so I'll add a little icon.
  if errors
    $('<img/>',
      height: 14
      id:     'errorIcon'
      src:    '../images/exclamation_red.png'
      title:  utils.i18n 'update_errors_text'
      width:  14
    ).prependTo footerL
  ext.popupHtml = $('<div/>').append(header, table, footer).html()

# Inject and execute `install.coffee` within each of the tabs provided (where
# valid).
executeScriptsInExistingTabs = (tabs) ->
  for tab in tabs when tab.url.indexOf(HOMEPAGE_DOMAIN) isnt -1
    chrome.tabs.executeScript tab.id, file: 'lib/install.js'

# Inject and execute `install.coffee` within all the tabs (where valid) of each
# Chrome window.
executeScriptsInExistingWindows = ->
  chrome.windows.getAll null, (windows) ->
    for win in windows
      chrome.tabs.query windowId: win.id, executeScriptsInExistingTabs

# Attempt to retrieve the details for the persisted update frequency.
getFrequency = ->
  frequency = utils.get 'frequency'
  return freq for freq in ext.FREQUENCIES when freq.value is frequency

# Return the number of status updates detected by this extension for an order
# since the specified time.
getOrderStatusUpdates = (order, lastRead) ->
  count = 0
  count++ for update in order.updates when update.timeStamp > lastRead
  return count

# Return the URL of the page on the Apple US store for the specified order.
getOrderUrl = (order) ->
  encode = encodeURIComponent
  return "#{ORDER_URL}#{encode order.number}/#{encode order.code}"

# Attempt to derive the status text to be displayed for the indexed order.  
# The status text will either be that of the latest update or a single
# whitespace character if no status updates have been detected yet for that
# order.
getStatusText = (index) ->
  length = ext.orders[index].updates.length
  return ' ' if length is 0
  return ext.orders[index].updates[length - 1].status

# Return the total number of detected status updates for all existing orders
# since the last time badges were cleared.
getStatusUpdates = ->
  count    = 0
  lastRead = utils.get 'lastRead'
  count += getOrderStatusUpdates order, lastRead for order in ext.orders
  return count

# Return all windows managed by this extension that are displaying a page that
# begins with the specified URL.
getWindows = (url) ->
  return chrome.extension.getViews(type: 'tab').filter (element) ->
    return element.location.href.indexOf(url) is 0

# Handle the conversion/removal of older version of settings that may have
# been stored previously by `ext.init`.
init_update = ->
  update_progress = utils.get 'update_progress'
  update_progress.settings ?= []
  # Check if the settings need updated for 1.1.0.
  if update_progress.settings.indexOf('1.1.0') is -1
    # Update the settings for 1.1.0.
    freq      = ext.FREQUENCIES[1].value
    frequency = utils.get 'frequency'
    utils.set 'frequency', freq if frequency > -1 and frequency < freq
    # Ensure that settings are not updated for 1.1.0 again.
    update_progress.settings.push '1.1.0'
    utils.set 'update_progress', update_progress

# Initialize the persisted managed orders.
initOrders = ->
  utils.init 'orders', []
  ext.orders = utils.get 'orders'

# Determine whether or not an order already has the specified status.
isOrderStatusNew = (order, status) ->
  return no for update in order.updates when update.status is status
  return yes

# Determine whether or not the specified status is recognised by iOrder.
isValidOrderStatus = (status) ->
  return status in STATUS

# Ensure any badge notification is cleared.
markRead = (retainTimeStamp) ->
  updates = 0
  utils.set 'lastRead', $.now() unless retainTimeStamp
  setBadge()
  # Update the UI so the clear button vanishes.
  updatePopup()

# Attempt to notify the user of any unread status updates.  
# If there are no status updates, remove any visible badge.
notify = ->
  oldUpdates = updates
  updates = getStatusUpdates()
  # Update/clear badge depending on setting and updates available.
  if utils.get 'badges'
    setBadge updates or ''
  else
    setBadge()
  # Show the notification if setting enabled and has new updates.
  if utils.get('notifications') and updates > oldUpdates
    webkitNotifications.createHTMLNotification(
      chrome.extension.getURL 'pages/notification.html'
    ).show()

# Listener for internal requests.  
# This function will handle the request based on its type and the data
# provided.
onRequest = (request, sender, sendResponse) ->
  order   = {}
  url     = ''
  # Check what needs to be done... and then do it.
  switch request.type
    when 'clear' then markRead()
    when 'options'
      # Try using existing tabs for the options page before creating one.
      url = chrome.extension.getURL 'pages/options.html'
      selectOrCreateTab url, (isNew) ->
        return if isNew
        win.options.refresh() for win in getWindows url
    when 'refresh' then updateManager.restart()
    when 'track'
      order = ext.getOrder request.data.number, request.data.code
      chrome.tabs.create url: order.trackingUrl if order and order.trackingUrl
    when 'viewAll' then chrome.tabs.create url: ORDERS_URL
    when 'view'
      order = ext.getOrder request.data.number, request.data.code
      chrome.tabs.create url: getOrderUrl order if order

# Attempt to select a tab in the current window displaying a page whose
# location begins with the specified URL.  
# If no existing tab exists a new one is simply created.
selectOrCreateTab = (url, callback) ->
  chrome.windows.getCurrent (win) ->
    chrome.tabs.query 
      active:   yes
      windowId: win.id
    , (tabs) ->
      # Try to find an existing tab.
      break for tab in tabs when tab.url.indexOf(url) is 0
      if tab
        # Found one! Now to select it.
        chrome.tabs.update tab.id, selected: yes
        callback? no
      else
        # Ach well, let's just create a new one.
        chrome.tabs.create url: url
        callback? yes

# Set the badge text to the specified string.  
# If no string is specified the badge is cleared.
setBadge = (str = '') ->
  chrome.browserAction.setBadgeText text: String str

# Send an AJAX request to the specified order's page on the Apple US store and
# parses the response to update the order's properties.  
# If an *error* occurs during the update process assign a short description to
# `order.error`.
updateOrder = (order, callback) ->
  $.get(getOrderUrl(order), (data) ->
    # Probably won't happen; more of a sanity check.
    return order.error = 'update_invalid_page_error' unless data
    # Extract the relevant elements wrapped in jQuery goodness.
    heading     = $(data).find '.order .delivery-group .sb-heading'
    status      = heading.find 'h4 span:first-child'
    trackingUrl = heading.find ".group-actions tr:first-child td
 a[href^='#{TRACKER_URL}']"
    # Dig deeper and try and get the actual values.
    status      = if status.length then status.text() else ''
    trackingUrl = if trackingUrl.length then trackingUrl.attr 'href' else ''
    if status
      # A possible status was found but is it valid?
      if isValidOrderStatus status
        # OK, it was valid; but is it new???
        if isOrderStatusNew order, status
          # Right! It was valid and new! Just add it already.
          order.updates.push
            status:    status
            timeStamp: $.now()
      else
        # Extension could need updated if it gets here.
        return order.error = 'update_invalid_status_error'
    else
      # Bad user data or extension could need updated.
      return order.error = 'update_status_not_found_error'
    # Only update the Track link if it was found.
    order.trackingUrl = trackingUrl if trackingUrl
    # Clear any pre-existing errors.
    order.error = ''
  ).error(->
    # Something went wrong.
    order.error = 'update_page_not_found_error'
  ).complete ->
    # Done! Now let's tell the boss.
    callback?.apply updateManager, [order]

# Build the HTML to populate the popup with to optimize popup loading times and
# updates any popup currently being displayed.
updatePopup = ->
  buildPopup()
  popup = chrome.extension.getViews(type: 'popup')[0]
  popup.document.body.innerHTML = ext.popupHtml if popup

#### Update Manager setup

# Central manager for updating the orders.  
# This manager can handle concurrent start, stop and restart requests while also
# supporting repeat (looping) functionality.
updateManager =

  # Unique interval identifier used to managed repeating updates.
  id: undefined

  # Message stack used by the current update process.  
  # Any start/stop/restart requests made while the manager is updating is added
  # to this stack and actioned upon completion of the process.
  # Afterwards, the stack is cleared for the next process.
  messages: []

  # Indicate whether or not the update manager is currently running through an
  # update process.
  updating: no

  # Restart the update manager, which may run once or start a repeating cycle
  # based on the current update frequency.  
  # If this is called during an active update process the manager will restart
  # upon completion.
  restart: ->
    frequency = utils.get 'frequency'
    # I'm busy; I'll do it later.
    return this.messages.push 'restart' if @updating
    # Clear the current cycle, where applicable.
    if @id
      clearInterval @id
      # Ensure that it is disabled, where applicable.
      @id = undefined if frequency is -1
    # Start a new cycle if required.
    @id = setInterval @run, frequency if frequency isnt -1
    # Run the initial process.
    @run()

  # Core of the update manager which actually performs the update process.  
  # This process updates all orders and ensures the results are reflected in the
  # popup.
  run: ->
    progress  = 0
    @updating = yes
    # Update the UI to show that I'm busy.
    notify()
    updatePopup()

    # Called when the AJAX request has been parsed and read for each order.  
    # This should be called regardless of errors being encountered.
    updated = (order) ->
      progress++
      # Check if all orders have been updated; supports no orders.
      if progress >= ext.orders.length
        @updating = no
        # Persist orders and update time stamp.
        utils.set 'orders', ext.orders
        utils.set 'lastUpdated', $.now()
        # Update the UI again to reflect the changes.
        notify()
        updatePopup()
        # Now read the message stack.
        this[message]?() for message in @messages
        @messages = []

    # Finish this now since no orders exist.
    updated.apply this unless ext.orders.length
    # Update each order by parsing its page on the Apple US store.
    updateOrder order, updated for order in ext.orders

  # Start the update manager, which may run once or start a repeating cycle
  # based on the current update frequency.
  start: ->
    frequency = utils.get 'frequency'
    # Clear the current cycle, where applicable.
    if frequency is -1
      if @id
        clearInterval @id
        @id = undefined
    else
      # I start twice for no one... see RESTART for that.
      return if @id
      # Start a new cycle.
      @id = setInterval @run, frequency
    # Run the initial process.
    @run()

  # Stop the update manager.  
  # If this is called during an active update process the manager will stop upon
  # completion.
  stop: ->
    # I'm busy; I'll do it later.
    return @messages.push 'stop' if @updating
    # Clear the current cycle, where possible.
    if @id
      clearInterval @id
      @id = undefined

#### Background page setup

ext = window.ext =

  #### Public constants

  # Details for the supported update frequencies.
  FREQUENCIES: [
    text:  utils.i18n 'freq_disabled'
    value: -1
  ,
    text:  utils.i18n 'freq_minutes', '15'
    value: 15 * 60 * 1000
  ,
    text:  utils.i18n 'freq_minutes', '30'
    value: 30 * 60 * 1000
  ,
    text:  utils.i18n 'freq_minutes', '45'
    value: 45 * 60 * 1000
  ,
    text:  utils.i18n 'freq_hour'
    value: 60 * 60 * 1000
  ,
    text:  utils.i18n 'freq_hours', '2'
    value: 2 * 60 * 60 * 1000
  ]

  #### Public variables

  # List of orders currently being maintained.  
  # This should always be an exact reflection of the orders persisted in
  # `localStorage`.
  orders:    []

  # Pre-prepared HTML for the popup to be populated using.  
  # This should be updated whenever orders are changed/updated in any way as
  # this is generated to improve performance and load times of the popup frame.
  popupHtml: ''

  #### Public functions

  # Attempt to return the order whose details match the specified criteria.
  getOrder: (number, code) ->
    for order in ext.orders when order.number is number and order.code is code
      return order

  # Initialize the background page.  
  # This will involve initializing the settings, adding the request listeners
  # and starting the update manager.
  init: ->
    utils.init 'update_progress', {}
    init_update()
    utils.init 'badges', on
    utils.init 'frequency', ext.FREQUENCIES[1].value
    utils.init 'lastRead', $.now()
    utils.init 'lastUpdated', $.now()
    utils.init 'notifications', on
    utils.init 'notificationDuration', 6 * 1000
    initOrders()
    chrome.extension.onRequest.addListener onRequest
    # It's nice knowing what version is running.
    $.getJSON chrome.extension.getURL('manifest.json'), (data) ->
      version = data.version
      # Execute content scripts now that we know the version.
      executeScriptsInExistingWindows()
    # It's alive!
    updateManager.start()
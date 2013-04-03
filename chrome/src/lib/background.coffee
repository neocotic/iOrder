# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

# Private constants
# -----------------

# Extension ID being used by iOrder.
EXTENSION_ID      = i18n.get '@@extension_id'
# Domain of this extension's homepage.
HOMEPAGE_DOMAIN   = 'neocotic.com'
# Extension ID of the production version of iOrder.
REAL_EXTENSION_ID = 'kflemogpkbophbipihnbcmlplbihbdhb'

# Private variables
# -----------------

# Indicate whether or not iOrder has just been installed.
isNewInstall      = no
# Indicate whether or not iOrder is currently running the production build.
isProductionBuild = EXTENSION_ID is REAL_EXTENSION_ID
# Number of status updates since the user last cleared it.
updates           = 0

# Private functions
# -----------------

# Transform specific sections of the data loaded from `configuration.json` so that they're more
# useable and localized.
buildConfig = ->
  log.trace()
  do buildFrequencies
  do buildStatus

# Transform the configuration frequencies into useable localized options.
buildFrequencies = ->
  log.trace()
  for mins, i in ext.config.frequencies
    hours = mins / 60
    ext.config.frequencies[i] = if mins is -1
      text:  i18n.get 'freq_disabled'
      value: mins
    else
      text:  (
        if hours < 1
          i18n.get 'freq_minutes', mins
        else if hours is 1
          i18n.get 'freq_hour'
        else
          i18n.get 'freq_hours', hours
      )
      value: mins * 60 * 1000

# Build the HTML to populate the popup with to optimize popup loading times.
buildPopup = ->
  log.trace()
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
  headerL.append $ '<a/>',
    href:    '#'
    id:      'optionsLink'
    text:    i18n.get 'pop_options_text'
    title:   i18n.get 'pop_options_title'
  headerL.append $ '<a/>',
    href:    '#'
    id:      'ordersLink'
    text:    i18n.get 'pop_orders_text'
    title:   i18n.get 'pop_orders_title'
  # Add the refresh button to the footer (can be removed though).
  footerF.append $ '<button/>',
    id:      'refreshLink'
    text:    i18n.get 'pop_refresh_button'
    title:   i18n.get 'pop_refresh_button_title'
  # Change the refresh button to show I'm busy... I am y'know.
  if updateManager.updating
    footerF.find('button:first-child').attr(
      disabled: 'disabled'
      title:    i18n.get 'pop_refresh_button_title_alt'
    ).html i18n.get 'pop_refresh_button_alt'
  # Add the clear button if badges are visibile; they can be distracting.
  if updates and store.get 'notifications.badges'
    footerF.append $ '<button/>',
      id:      'clearLink'
      text:    i18n.get 'pop_clear_button'
      title:   i18n.get 'pop_clear_button_title'
  # Add the update details to the footer.
  footerL.append $ '<span/>',
    text: i18n.get('pop_footer', [
      new Date(store.get 'lastUpdated').format 'H:i'
      getFrequency().text
    ])
  # Add the column headers to the orders table.
  $('<thead/>').append(
    $.prototype.append.apply $('<tr/>'), [
      $ '<th/>', text: i18n.get 'pop_order_header'
      $ '<th/>', text: i18n.get 'pop_status_header'
      $ '<th/>', text: i18n.get 'pop_actions_header'
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
      ).html i18n.get 'empty'
    ).appendTo tbody
    footer.find('#refreshLink').remove()
  # Otherwise; let's create a row for each order.
  for order in ext.orders
    tbody.append(
      $.prototype.append.apply $('<tr/>'), [
        $.prototype.append.apply $('<td/>'), [
          $ '<strong/>', text: order.label
          '<br />'
          $ '<a/>',
            'data-order-code':   order.code
            'data-order-number': order.number
            href:                '#'
            text:                order.number
            title:               i18n.get 'pop_order_title'
        ]
        $('<td/>').append $ '<span/>', text: ext.getStatusText order
      ]
    )
    # Order had an error; I suppose I should tell the user.
    if order.error
      errors = yes
      tbody.find('tr:last-child td:first-child strong').attr
        class: 'error'
        title: i18n.get order.error
    # Found the track link so I'll share it with the user. I'm good like that.
    if order.trackingUrl
      tbody.find('tr:last-child').append $('<td/>').append $ '<a/>',
          'data-order-code':   order.code
          'data-order-number': order.number
          href:                '#'
          text:                i18n.get 'pop_track_text'
          title:               i18n.get 'pop_track_title'
    else
      tbody.find('tr:last-child').append $('<td/>').append ' '
  # One or more order has an error so I'll add a little icon.
  if errors
    $('<img/>',
      height: 14
      id:     'errorIcon'
      src:    '../images/exclamation_red.png'
      title:  i18n.get 'pop_errors_title'
      width:  14
    ).prependTo footerL
  ext.popupHtml = $('<div/>').append(header, table, footer).html()

# Transform the configuration status into useable localized options.
buildStatus = ->
  log.trace()
  for status, i in ext.config.status
    ext.config.status[i] =
      text:  i18n.get "status_#{i}_text"
      value: /// ^ #{status} $ ///i

# Inject and execute `install.coffee` within each of the tabs provided (where valid).
executeScriptsInExistingTabs = (tabs) ->
  log.trace()
  for tab in tabs when tab.url.indexOf(HOMEPAGE_DOMAIN) isnt -1
    chrome.tabs.executeScript tab.id, file: 'lib/install.js'

# Inject and execute `install.coffee` within all the tabs (where valid) of each Chrome window.
executeScriptsInExistingWindows = ->
  log.trace()
  chrome.windows.getAll null, (windows) ->
    for win in windows
      chrome.tabs.query windowId: win.id, executeScriptsInExistingTabs

# Attempt to retrieve the details for the persisted update frequency.
getFrequency = ->
  log.trace()
  frequency = store.get 'frequency'
  return freq for freq in ext.config.frequencies when freq.value is frequency

# Return the number of status updates detected by this extension for an order since the specified
# time.
getOrderStatusUpdates = (order, lastRead) ->
  log.trace()
  count = 0
  count++ for update in order.updates when update.timeStamp > lastRead
  count

# Return the recognized status that matches the specified `text`.
getStatus = (text) ->
  log.trace()
  ext.config.status[getStatusIndex text]

# Return the index of the recognized status that matches the specified `text`.
getStatusIndex = (text) ->
  log.trace()
  text = text?.trim()
  return i for status, i in ext.config.status when status.value.test text
  -1

# Return the total number of detected status updates for all existing orders since the last time
# badges were cleared.
getStatusUpdates = ->
  log.trace()
  count    = 0
  lastRead = store.get 'lastRead'
  count += getOrderStatusUpdates order, lastRead for order in ext.orders
  count

# Return all windows managed by this extension that are displaying a page that begins with the
# specified URL.
getWindows = (url) ->
  log.trace()
  chrome.extension.getViews(type: 'tab').filter (element) ->
    element.location.href.indexOf(url) is 0

# Handle the conversion/removal of older version of settings that may have been stored previously
# by `ext.init`.
init_update = ->
  log.trace()
  # Update the update progress indicator itself.
  if store.exists 'update_progress'
    store.modify 'updates', (updates) ->
      progress = store.remove 'update_progress'
      for own namespace, versions of progress
        updates[namespace] = if versions?.length then versions.pop() else ''
  # Create updater for the `settings` namespace.
  updater      = new store.Updater 'settings'
  isNewInstall = updater.isNew
  # Define the processes for all required updates to the `settings` namespace.
  updater.update '1.1.0', ->
    log.info 'Updating general settings for 1.1.0'
    freq      = ext.config.frequencies[1].value
    frequency = store.get 'frequency'
    store.set 'frequency', freq if frequency > -1 and frequency < freq
  updater.update '1.2.0', ->
    log.info 'Updating general settings for 1.2.0'
    store.set 'notifications',
      badges:   store.get('badges')               ? on
      duration: store.get('notificationDuration') ? 3000
      enabled:  store.get('notifications')        ? yes
    store.remove 'badges', 'notificationDuration'

# Initialize `order` and its properties.
initOrder = (order) ->
  log.trace()
  order.error       ?= ''
  order.code        ?= ''
  order.label       ?= ''
  order.number      ?= ''
  order.trackingUrl ?= ''
  order.updates     ?= []
  for update in order.updates
    update.status    ?= -1
    update.timeStamp ?= $.now()
  order

# Initialize the persisted managed orders.
initOrders = ->
  log.trace()
  do initOrders_update
  # Initialize all orders to ensure their properties are valid.
  store.modify 'orders', (orders) ->
    initOrder order for order in orders
  ext.updateOrders()

# Handle the conversion/removal of older version of settings that may have been stored previously
# by `initOrders`.
initOrders_update = ->
  log.trace()
  # Create updater for the `orders` namespace.
  updater = new store.Updater 'orders'
  # Define the processes for all required updates to the `orders` namespace.
  updater.update '1.2.0', ->
    log.info 'Updating order settings for 1.2.0'
    store.modify 'orders', (orders) ->
      for order in orders
        if order.error is 'update_status_not_found_error'
          order.error = 'update_invalid_status_error'
        order.key    ?= utils.keyGen()
        update.status = getStatusIndex update.status for update in order.updates

# Determine whether or not an order already has the specified status.
isOrderStatusNew = (order, status) ->
  log.trace()
  return no for update in order.updates when update.status is status
  yes

# Ensure any badge notification is cleared.
markRead = (retainTimeStamp) ->
  log.trace()
  updates = 0
  store.set 'lastRead', $.now() unless retainTimeStamp
  do setBadge
  # Update the UI so the clear button vanishes.
  do updatePopup

# Attempt to notify the user of any unread status updates.  
# If there are no status updates, remove any visible badge.
notify = ->
  log.trace()
  notifications = store.get 'notifications'
  oldUpdates    = updates
  updates       = getStatusUpdates()
  # Update/clear badge depending on setting and updates available.
  setBadge if notifications.badges then updates or ''
  # Show the notification if setting enabled and has new updates.
  if updates > oldUpdates and notifications.enabled
    webkitNotifications.createHTMLNotification(
      utils.url 'pages/notification.html'
    ).show()

# Listener for internal messages.  
# This function will handle the message based on its type and the data provided.
onMessage = (message, sender, sendResponse) ->
  log.trace()
  order = {}
  url   = ''
  # Attempt to return the order whose details match the specified criteria.
  getOrder = (data) ->
    {code, number} = data
    ext.queryOrder (order) -> order.number is number and order.code is code
  # Check what needs to be done... and then do it.
  switch message.type
    when 'clear' then do markRead
    when 'options'
      # Try using existing tabs for the options page before creating one.
      url = utils.url 'pages/options.html'
      selectOrCreateTab url, (isNew) ->
        return if isNew
        win.options.refresh() for win in getWindows url
    when 'refresh' then ext.updateOrders()
    when 'track'
      order = getOrder message.data
      chrome.tabs.create url: order.trackingUrl if order and order.trackingUrl
    when 'viewAll' then chrome.tabs.create url: ext.config.apple.url.list
    when 'view'
      order = getOrder message.data
      chrome.tabs.create url: ext.getOrderUrl order if order

# Attempt to select a tab in the current window displaying a page whose location begins with the
# specified URL.  
# If no existing tab exists a new one is simply created.
selectOrCreateTab = (url, callback) ->
  log.trace()
  chrome.windows.getCurrent (win) ->
    chrome.tabs.query windowId: win.id, (tabs) ->
      # Try to find an existing tab.
      for tab in tabs
        if tab.url.indexOf(url) is 0
          existingTab = tab
          break
      if existingTab
        # Found one! Now to select it.
        chrome.tabs.update existingTab.id, selected: yes
        callback? no
      else
        # Ach well, let's just create a new one.
        chrome.tabs.create url: url
        callback? yes

# Set the badge text to the specified string.  
# If no string is specified the badge is cleared.
setBadge = (str = '') ->
  log.trace()
  chrome.browserAction.setBadgeText text: String str

# Send an AJAX request to the specified order's page on the Apple US store and parses the response
# to update the order's properties.  
# If an *error* occurs during the update process assign a short description to `order.error`.
updateOrder = (order, callback) ->
  log.trace()
  $.get(ext.getOrderUrl(order), (data) ->
    # Probably won't happen; more of a sanity check.
    return order.error = 'update_invalid_page_error' unless data
    # Extract the relevant elements wrapped in jQuery goodness.
    heading     = $(data).find '.order .ship-group .sb-heading'
    status      = heading.find 'h4 span:first-child'
    trackingUrl = heading.find """
      .group-actions tr:first-child td a[href^='#{ext.config.apple.url.track}']
    """
    # Dig deeper and try and get the actual values.
    status      = getStatusIndex if status.length then status.text() else ''
    trackingUrl = if trackingUrl.length then trackingUrl.attr 'href' else ''
    if status >= 0
      # OK, it was valid; but is it new???
      if isOrderStatusNew order, status
        # Right! It was valid and new! Just add it already.
        order.updates.push
          status:    status
          timeStamp: $.now()
    else
      # Bad user data or extension could need updated.
      return order.error = 'update_invalid_status_error'
    # Only update the Track link if it was found.
    order.trackingUrl = trackingUrl if trackingUrl
    # Clear any pre-existing errors.
    order.error = ''
  ).error( ->
    # Something went wrong.
    order.error = 'update_page_not_found_error'
  ).complete ->
    # Done! Now let's tell the boss.
    callback?.apply updateManager, [order]

# Build the HTML to populate the popup with to optimize popup loading times and updates any popup
# currently being displayed.
updatePopup = ->
  log.trace()
  do buildPopup
  chrome.extension.getViews(type: 'popup')[0]?.popup.init()

# Update Manager setup
# --------------------

# Central manager for updating the orders.  
# This manager can handle concurrent start, stop and restart requests while also supporting repeat
# (looping) functionality.
updateManager =

  # Unique interval identifier used to managed repeating updates.
  id: undefined

  # Message stack used by the current update process.  
  # Any start/stop/restart requests made while the manager is updating is added to this stack and
  # actioned upon completion of the process. Afterwards, the stack is cleared for the next process.
  messages: []

  # Indicate whether or not the update manager is currently running through an update process.
  updating: no

  # Restart the update manager, which may run once or start a repeating cycle based on the current
  # update frequency.  
  # If this is called during an active update process the manager will restart upon completion.
  restart: ->
    log.trace()
    log.info 'Restarting update manager'
    frequency = store.get 'frequency'
    # I'm busy; I'll do it later.
    return @messages.push 'restart' if @updating
    # Clear the current cycle, where applicable.
    if @id
      clearInterval @id
      # Ensure that it is disabled, where applicable.
      @id = undefined if frequency is -1
    # Start a new cycle if required.
    @id = setInterval @run, frequency if frequency isnt -1
    # Run the initial process.
    do @run

  # Core of the update manager which actually performs the update process.  
  # This process updates all orders and ensures the results are reflected in the popup.
  run: ->
    log.trace()
    log.info 'Running update manager'
    @progress = 0
    @updating = yes
    # Update the UI to show that I'm busy.
    do notify
    do updatePopup

    # Called when the AJAX request has been parsed and read for each order.  
    # This should be called regardless of errors being encountered.
    updated = (order) ->
      log.trace()
      log.debug 'Updating order...', order
      @progress++
      # Check if all orders have been updated; supports no orders.
      if @progress >= ext.orders.length
        @updating = no
        # Persist orders and update time stamp.
        store.set 'orders', ext.orders
        store.set 'lastUpdated', $.now()
        # Update the UI again to reflect the changes.
        do notify
        do updatePopup
        # Now read the message stack.
        this[message]?() for message in @messages
        @messages = []

    # Finish this now since no orders exist.
    updated.apply this unless ext.orders.length
    # Update each order by parsing its page on the Apple US store.
    updateOrder order, updated for order in ext.orders

  # Start the update manager, which may run once or start a repeating cycle based on the current
  # update frequency.
  start: ->
    log.trace()
    log.info 'Starting update manager'
    frequency = store.get 'frequency'
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
    do @run

  # Stop the update manager.  
  # If this is called during an active update process the manager will stop upon completion.
  stop: ->
    log.trace()
    log.info 'Stopping update manager'
    # I'm busy; I'll do it later.
    return @messages.push 'stop' if @updating
    # Clear the current cycle, where possible.
    if @id
      clearInterval @id
      @id = undefined

# Background page setup
# ---------------------

ext = window.ext = new class Extension extends utils.Class

  # Public variables
  # ----------------

  # Configuration data loaded at runtime.
  config: {}

  # List of orders currently being maintained.  
  # This should always be an exact reflection of the orders persisted in `localStorage`.
  orders: []

  # Pre-prepared HTML for the popup to be populated using.  
  # This should be updated whenever orders are changed/updated in any way as this is generated to
  # improve performance and load times of the popup frame.
  popupHtml: ''

  # Current version of iOrder.
  version: ''

  # Public functions
  # ----------------

  # Initialize the background page.  
  # This will involve initializing the settings, adding the message listeners and starting the
  # update manager.
  init: ->
    log.trace()
    log.info 'Initializing extension controller'
    # Add support for analytics if the user hasn't opted out.
    analytics.add() if store.get 'analytics'
    tasks = []
    # It's nice knowing what version is running.
    tasks.push (callback) =>
      $.getJSON utils.url('manifest.json'), (data) =>
        @version = data.version
        do callback
    # Load and store the configuration data.
    tasks.push (callback) =>
      $.getJSON utils.url('configuration.json'), (data) =>
        @config = data
        do buildConfig
        do callback
    # Begin initialization.
    tasks.push (callback) =>
      store.init
        frequency:     @config.frequencies[1].value
        lastRead:      $.now()
        lastUpdated:   $.now()
        notifications: {}
        orders:        []
      do init_update
      store.modify 'notifications', (notifications) ->
        notifications.badges   ?= on
        notifications.duration ?= 3000
        notifications.enabled  ?= yes
      utils.onMessage 'extension', no, onMessage
      do initOrders
      do callback
    async.series tasks, (err) ->
      throw err if err
      analytics.track 'Installs', 'New', @version, Number isProductionBuild if isNewInstall
      # Execute content scripts now that we know the version.
      do executeScriptsInExistingWindows

  # Return the URL of the page on the Apple store for the specified order.
  getOrderUrl: (order) ->
    log.trace()
    encode = encodeURIComponent
    "#{ext.config.apple.url.detail}#{encode order.number}/#{encode order.code}"

  # Attempt to derive the status text to be displayed for the order.  
  # The status text will either be that of the latest update or a single whitespace character if no
  # status updates have been detected yet for that order.
  getStatusText: (order) ->
    log.trace()
    index = if order.updates?.length then order.updates[-1..].status else -1
    ext.config.status[index]?.text

  # Retrieve the first order that passes the specified `filter`.
  queryOrder: (filter, singular = yes) ->
    log.trace()
    utils.query @orders, singular, filter

  # Retrieve all orders that pass the specified `filter`.
  queryOrders: (filter) -> @queryOrder filter, no

  # Update the local list of orders to reflect those persisted.  
  # It is very important that this is called whenever orders may have been changed in order to
  # prepare the popup HTML and optimize performance, while also ensuring orders are correctly
  # managed during by the next update.
  updateOrders: ->
    log.trace()
    @orders = store.get 'orders'
    @orders.sort (a, b) -> a.index - b.index
    do updatePopup
    updateManager.restart()

# Initialize `ext` when the DOM is ready.
utils.ready -> ext.init()
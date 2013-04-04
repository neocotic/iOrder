# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

# Private constants
# -----------------

# Regular expression used to sanitize search queries.
R_CLEAN_QUERY = /[^\w\s]/g
# Regular expression used to validate order keys.
R_VALID_KEY   = /^[A-Z0-9]*\.[A-Z0-9]*$/i
# Regular expression used to identify whitespace.
R_WHITESPACE  = /\s+/

# Private variables
# -----------------

# Copy of order being actively modified.
activeOrder   = null
# Easily accessible reference to the extension controller.
{ext}         = chrome.extension.getBackgroundPage()
# Indicate whether or not the user feedback feature has been added to the page.
feedbackAdded = no
# Orders matching the current search query.
searchResults = null

# Load functions
# --------------

# Bind an event of the specified `type` to the elements included by `selector` that, when
# triggered, modifies the underlying `option` with the value returned by `evaluate`.
bindSaveEvent = (selector, type, option, evaluate, callback) ->
  log.trace()
  $(selector).on type, ->
    $this = $ this
    key   = ''
    value = null
    store.modify option, (data) ->
      key = $this.attr('id').match(new RegExp("^#{option}(\\S*)"))[1]
      key = key[0].toLowerCase() + key.substr 1
      data[key] = value = evaluate.call $this, key
    callback? $this, key, value

# Update the options page with the values from the current settings.
load = ->
  log.trace()
  $('#analytics').prop 'checked', store.get 'analytics'
  do loadSaveEvents
  do loadFrequencies
  do loadOrders
  do loadNotifications
  do loadDeveloperTools

# Update the developer tools section of the options page with the current settings.
loadDeveloperTools = ->
  log.trace()
  do loadLogger

# Update the frequency section of the options page with the current settings.
loadFrequencies = ->
  log.trace()
  frequency  = store.get 'frequency'
  $frequency = $ '#frequency'
  # Start from a clean slate.
  $frequency.remove 'option'
  # Create and insert options representing each available update frequency.
  for freq in ext.config.frequencies
    option = $ '<option/>',
      text:  freq.text
      value: freq.value
    option.prop 'selected', freq.value is frequency
    $frequency.append option
  do loadFrequenciesSaveEvents

# Bind the event handlers required for persisting frequency changes.
loadFrequenciesSaveEvents = ->
  log.trace()
  $('#frequency').on 'change', ->
    value = $(this).val()
    log.debug "Changing frequency to '#{value}'"
    store.set 'frequency', parseInt frequency, 10
    ext.updateOrders()
    analytics.track 'General', 'Changed', 'Frequency', value

# Update the logging section of the options page with the current settings.
loadLogger = ->
  log.trace()
  logger = store.get 'logger'
  $('#loggerEnabled').prop 'checked', logger.enabled
  loggerLevel = $ '#loggerLevel'
  loggerLevel.find('option').remove()
  for level in log.LEVELS
    option = $ '<option/>',
      text:  i18n.get "opt_logger_level_#{level.name}_text"
      value: level.value
    option.prop 'selected', level.value is logger.level
    loggerLevel.append option
  # Ensure debug level is selected if configuration currently matches none.
  unless loggerLevel.find('option[selected]').length
    loggerLevel.find("option[value='#{log.DEBUG}']").prop 'selected', yes
  do loadLoggerSaveEvents

# Bind the event handlers required for persisting logging changes.
loadLoggerSaveEvents = ->
  log.trace()
  bindSaveEvent '#loggerEnabled, #loggerLevel', 'change', 'logger', (key) ->
    value = if key is 'level' then @val() else @is ':checked'
    log.debug "Changing logging #{key} to '#{value}'"
    value
  , (jel, key, value) ->
    logger = store.get 'logger'
    chrome.extension.getBackgroundPage().log.config = log.config = logger
    analytics.track 'Logging', 'Changed', key[0].toUpperCase() + key.substr(1), Number value

# Update the notification section of the options page with the current settings.
loadNotifications = ->
  log.trace()
  {badges, duration, enabled} = store.get 'notifications'
  $('#notificationsBadges').prop 'checked', badges
  $('#notificationsDuration').val if duration > 0 then duration * .001 else 0
  $('#notificationsEnabled').prop 'checked', enabled
  do loadNotificationSaveEvents

# Bind the event handlers required for persisting notification changes.
loadNotificationSaveEvents = ->
  log.trace()
  bindSaveEvent '#notificationsBadges, #notificationsDuration, #notificationsEnabled', 'change',
    'notifications', (key) ->
      value = if key is 'duration'
        milliseconds = @val()
        if milliseconds then parseInt(milliseconds, 10) * 1000 else 0
      else
        @is ':checked'
      log.debug "Changing notifications #{key} to '#{value}'"
      value
  , (jel, key, value) ->
    analytics.track 'Notifications', 'Changed', key[0].toUpperCase() + key.substr(1), Number value

# Create a `tr` element representing the `order` provided.  
# The element returned should then be inserted in to the table that is displaying the orders.
loadOrder = (order) ->
  log.trace()
  log.debug 'Creating a row for the following order...', order
  row = $ '<tr/>', draggable: yes
  alignCenter = css: 'text-align': 'center'
  row.append $('<td/>', alignCenter).append $ '<input/>',
    title: i18n.get 'opt_select_box'
    type:  'checkbox'
    value: order.key
  row.append $('<td/>').append $ '<span/>',
    text:  order.label
    title: i18n.get 'opt_order_modify_title', order.label
  row.append $('<td/>').append $('<span/>').append $ '<a/>',
    href:   ext.getOrderUrl order
    target: '_blank'
    text:   order.number
    title:  i18n.get 'opt_order_title'
  row.append $('<td/>').append $ '<span/>', text: order.code
  row.append $('<td/>').append $ '<span/>', text: ext.getStatusText order
  row.append $('<td/>').append if order.trackingUrl
    $ '<a/>',
      href:   order.trackingUrl
      target: '_blank'
      text:   i18n.get 'opt_track_text'
      title:  i18n.get 'opt_track_title'
  else
    '&nbsp;'
  row.append $('<td/>').append $ '<span/>',
    class: 'muted'
    text:  '::::'
    title: i18n.get 'opt_order_move_title', order.label
  row

# Bind the event handlers required for controlling the orders.
loadOrderControlEvents = ->
  log.trace()
  # Ensure order wizard is closed if/when tabify links are clicked within it or it is cancelled.
  $('#order_wizard [tabify], #order_cancel_btn').on 'click', ->
    do closeWizard
  $('#order_reset_btn').on 'click', ->
    do resetWizard
  # Support search functionality for orders.
  filter = $ '#order_filter'
  filter.find('option').remove()
  for limit in ext.config.options.limits
    filter.append $ '<option/>', text: limit
  filter.append $ '<option/>',
    disabled: 'disabled'
    text:     '-----'
  filter.append $ '<option/>',
    text:  i18n.get 'opt_show_all_text'
    value: 0
  store.init 'options_limit', parseInt $('#order_filter').val(), 10
  limit = store.get 'options_limit'
  $('#order_filter option').each ->
    $this = $ this
    $this.prop 'selected', limit is parseInt $this.val(), 10
  $('#order_filter').on 'change', ->
    store.set 'options_limit', parseInt $(this).val(), 10
    loadOrderRows searchResults ? ext.orders
  $('#order_search :reset').on 'click', ->
    $('#order_search :text').val ''
    do searchOrders
  $('#order_controls').on 'submit', ->
    searchOrders $('#order_search :text').val()
  # Ensure user confirms deletion of order.
  $('#order_delete_btn').on 'click', ->
    $(this).hide()
    $('#order_confirm_delete').css 'display', 'inline-block'
  $('#order_undo_delete_btn').on 'click', ->
    $('#order_confirm_delete').hide()
    $('#order_delete_btn').show()
  $('#order_confirm_delete_btn').on 'click', ->
    $('#order_confirm_delete').hide()
    $('#order_delete_btn').show()
    deleteOrders [activeOrder]
    do closeWizard
  validationErrors = []
  $('#order_wizard').on 'hide', ->
    error.hide() for error in validationErrors
  $('#order_save_btn').on 'click', ->
    order = deriveOrder()
    # Clear all existing validation errors.
    error.hide() for error in validationErrors
    validationErrors = validateOrder order
    if validationErrors.length
      error.show() for error in validationErrors
    else
      validationErrors = []
      $.extend activeOrder, order
      saveOrder activeOrder
      $('#order_search :reset').hide()
      $('#order_search :text').val ''
      do closeWizard
  # Open the order wizard without any context.
  $('#add_btn').on 'click', ->
    openWizard null
  selectedOrders = []
  $('#delete_wizard').on 'hide', ->
      selectedOrders = []
      $('#delete_items li').remove()
  # Prompt the user to confirm removal of the selected order(s).
  $('#delete_btn').on 'click', ->
    deleteItems    = $ '#delete_items'
    selectedOrders = getSelectedOrders()
    deleteItems.find('li').remove()
    # Create list items for each order and allocate them accordingly.
    for order in selectedOrders
      deleteItems.append $ '<li/>', text: "#{order.label} (#{order.number})"
    # Begin the order removal process by showing the dialog.
    $('#delete_wizard').modal 'show'
  # Cancel the order removal process.
  $('#delete_cancel_btn, #delete_no_btn').on 'click', ->
    $('#delete_wizard').modal 'hide'
  # Finalize the order removal process.
  $('#delete_yes_btn').on 'click', ->
    deleteOrders selectedOrders
    $('#delete_wizard').modal 'hide'

# Load the `orders` into the table to be displayed to the user.  
# Optionally, pagination can be disabled but this should only really be used internally by the
# pagination process.
loadOrderRows = (orders = ext.orders, pagination = yes) ->
  log.trace()
  table = $ '#orders'
  # Start from a clean slate.
  table.find('tbody tr').remove()
  if orders.length
    # Create and insert rows representing each order.
    table.append loadOrder order for order in orders
    paginate orders if pagination
    activateTooltips table
    do activateDraggables
    do activateModifications
    do activateSelections
  else
    # Show single row to indicate no orders were found.
    table.find('tbody').append $('<tr/>').append $ '<td/>',
      colspan: table.find('thead th').length
      html:    i18n.get 'opt_no_orders_found_text'

# Update the orders section of the options page with the current settings.
loadOrders = ->
  log.trace()
  # Load all of the event handlers required for managing the orders.
  do loadOrderControlEvents
  # Load the order data into the table.
  do loadOrderRows

# Bind the event handlers required for persisting general changes.
loadSaveEvents = ->
  log.trace()
  $('#analytics').on 'change', ->
    enabled = $(this).is ':checked'
    log.debug "Changing analytics to '#{enabled}'"
    if enabled
      store.set 'analytics', yes
      chrome.extension.getBackgroundPage().analytics.add()
      analytics.add()
      analytics.track 'General', 'Changed', 'Analytics', 1
    else
      analytics.track 'General', 'Changed', 'Analytics', 0
      analytics.remove()
      chrome.extension.getBackgroundPage().analytics.remove()
      store.set 'analytics', no

# Save functions
# --------------

# Delete all of the `orders` provided.
deleteOrders = (orders) ->
  log.trace()
  keys = (order.key for order in orders)
  if keys.length
    keep = []
    for order, i in ext.orders when order.key not in keys
      orders.index = i
      keep.push order
    store.set 'orders', keep
    ext.updateOrders()
    if keys.length > 1
      log.debug "Deleted #{keys.length} orders"
      analytics.track 'Orders', 'Deleted', "Count[#{keys.length}]"
    else
      order = orders[0]
      log.debug "Deleted #{order.label} order"
      analytics.track 'Orders', 'Deleted', order.label
    loadOrderRows searchResults ? ext.orders

# Reorder the orders after a drag and drop *swap* by updating their indices and sorting them
# accordingly.  
# These changes are then persisted and should be reflected throughout the extension.
reorderOrders = (fromIndex, toIndex) ->
  log.trace()
  orders = ext.orders
  if fromIndex? and toIndex?
    orders[fromIndex].index = toIndex
    orders[toIndex].index   = fromIndex
  store.set 'orders', orders
  ext.updateOrders()

# Update and persist the `order` provided.  
# Any required validation should be performed perior to calling this method.
saveOrder = (order) ->
  log.trace()
  log.debug 'Saving the following order...', order
  isNew  = not order.key?
  orders = store.get 'orders'
  if isNew
    order.key = utils.keyGen()
    orders.push order
  else
    for temp, i in orders when temp.key is order.key
      orders[i] = order
      break
  store.set 'orders', orders
  ext.updateOrders()
  do loadOrderRows
  action = if isNew then 'Added' else 'Saved'
  analytics.track 'Orders', action, order.label
  order

# Validation classes
# ------------------

# `ValidationError` allows easy management and display of validation error messages that are
# associated with specific fields.
class ValidationError extends utils.Class

  # Create a new instance of `ValidationError`.
  constructor: (@id, @key) ->
    @className = 'error'

  # Hide any validation messages currently displayed for the associated field.
  hide: ->
    field = $ "##{@id}"
    field.parents('.control-group:first').removeClass @className
    field.parents('.controls:first').find('.help-block').remove()

  # Display the validation message for the associated field.
  show: ->
    field = $ "##{@id}"
    field.parents('.control-group:first').addClass @className
    field.parents('.controls:first').append $ '<span/>',
      class: 'help-block'
      html:  i18n.get @key

# `ValidationWarning` allows easy management and display of validation warning messages that are
# associated with specific fields.
class ValidationWarning extends ValidationError

  # Create a new instance of `ValidationWarning`.
  constructor: (@id, @key) ->
    @className = 'warning'

# Validation functions
# --------------------

# Indicate whether or not the specified `key` is valid.
isKeyValid = (key) ->
  log.trace()
  log.debug "Validating order key '#{key}'"
  R_VALID_KEY.test key

# Determine whether or not an order already exists with the specified `number`.
isNumberAvailable = (number) ->
  log.trace()
  log.debug "Validating order number '#{number}'"
  not ext.queryOrder (order) -> order.number is number

# Validate the `order` and return any validation errors/warnings that were encountered.
validateOrder = (order) ->
  log.trace()
  isNew  = not order.key?
  errors = []
  log.debug 'Validating the following order...', order
  # Label is missing but is required.
  unless order.label
    errors.push new ValidationError 'order_label', 'opt_order_label_invalid'
  # Number is missing but is required.
  unless order.number
    errors.push new ValidationError 'order_number', 'opt_order_number_invalid'
  # Number already exists.
  unless isNumberAvailable order.number
    errors.push new ValidationError 'order_number', 'opt_order_number_unavailable'
  # Zip/post code is missing but is required.
  unless order.code
    errors.push new ValidationError 'order_code', 'opt_order_code_invalid'
  # Indicate whether or not any validation errors were encountered.
  log.debug 'Following validation errors were found...', errors
  errors

# Miscellaneous classes
# ---------------------

# `Message` allows simple management and display of alert messages.
class Message extends utils.Class

  # Create a new instance of `Message`.
  constructor: (@block) ->
    @className = 'alert-info'
    @headerKey = 'opt_message_header'

  # Hide this `Message` if it has previously been displayed.
  hide: -> @alert?.alert 'close'

  # Display this `Message` at the top of the current tab.
  show: ->
    @header  = i18n.get @headerKey if @headerKey and not @header?
    @message = i18n.get @messageKey if @messageKey and not @message?
    @alert   = $ '<div/>', class: "alert #{@className}"
    @alert.addClass 'alert-block' if @block
    @alert.append $ '<button/>',
      class:          'close'
      'data-dismiss': 'alert'
      html:           '&times;'
      type:           'button'
    @alert.append $ "<#{if @block then 'h4' else 'strong'}/>", html: @header if @header
    @alert.append if @block then @message else " #{@message}" if @message
    @alert.prependTo $ $('#navigation li.active a').attr 'tabify'

# `ErrorMessage` allows simple management and display of error messages.
class ErrorMessage extends Message

  # Create a new instance of `ErrorMessage`.
  constructor: (@block) ->
    @className = 'alert-error'
    @headerKey = 'opt_message_error_header'

# `SuccessMessage` allows simple management and display of success messages.
class SuccessMessage extends Message

  # Create a new instance of `SuccessMessage`.
  constructor: (@block) ->
    @className = 'alert-success'
    @headerKey = 'opt_message_success_header'

# `WarningMessage` allows simple management and display of warning messages.
class WarningMessage extends Message

  # Create a new instance of `WarningMessage`.
  constructor: (@block) ->
    @className = ''
    @headerKey = 'opt_message_warning_header'

# Miscellaneous functions
# -----------------------

# Activate drag and drop functionality for reordering orders.  
# The activation is done cleanly, unbinding any associated events that have been previously bound.
activateDraggables = ->
  log.trace()
  table      = $ '#orders'
  dragSource = null
  draggables = table.find '[draggable]'
  draggables.off 'dragstart dragend dragenter dragover drop'
  draggables.on 'dragstart', (e) ->
    $this      = $ this
    dragSource = this
    table.removeClass 'table-hover'
    $this.addClass 'dnd-moving'
    $this.find('[data-original-title]').tooltip 'hide'
    e.originalEvent.dataTransfer.effectAllowed = 'move'
    e.originalEvent.dataTransfer.setData 'text/html', $this.html()
  draggables.on 'dragend', (e) ->
    draggables.removeClass 'dnd-moving dnd-over'
    table.addClass 'table-hover'
    dragSource = null
  draggables.on 'dragenter', (e) ->
    $this = $ this
    draggables.not($this).removeClass 'dnd-over'
    $this.addClass 'dnd-over'
  draggables.on 'dragover', (e) ->
    e.preventDefault()
    e.originalEvent.dataTransfer.dropEffect = 'move'
    no
  draggables.on 'drop', (e) ->
    $dragSource = $ dragSource
    e.stopPropagation()
    if dragSource isnt this
      $this = $ this
      $dragSource.html $this.html()
      $this.html e.originalEvent.dataTransfer.getData 'text/html'
      activateTooltips table
      do activateModifications
      do activateSelections
      fromIndex = $dragSource.index()
      toIndex   = $this.index()
      if searchResults?
        fromIndex = searchResults[fromIndex].index
        toIndex   = searchResults[toIndex].index
      reorderOrders fromIndex, toIndex
    no

# Activate functionality to open order wizard when a row is clicked.  
# The activation is done cleanly, unbinding any associated events that have been previously bound.
activateModifications = ->
  log.trace()
  $('#orders tbody tr td:not(:first-child)').off('click').on 'click', ->
    activeKey = $(this).parents('tr:first').find(':checkbox').val()
    openWizard ext.queryOrder (order) -> order.key is activeKey

# Activate select all/one functionality on the orders table.  
# The activation is done cleanly, unbinding any associated events that have been previously bound.
activateSelections = ->
  log.trace()
  table       = $ '#orders'
  selectBoxes = table.find 'tbody :checkbox'
  selectBoxes.off('change').on 'change', ->
    $this       = $ this
    messageKey  = 'opt_select_box'
    messageKey += '_checked' if $this.is ':checked'
    $this.attr 'data-original-title', i18n.get messageKey
    do refreshSelectButtons
  table.find('thead :checkbox').off('change').on 'change', ->
    $this       = $ this
    checked     = $this.is ':checked'
    messageKey  = 'opt_select_all_box'
    messageKey += '_checked' if checked
    $this.attr 'data-original-title', i18n.get messageKey
    selectBoxes.prop 'checked', checked
    do refreshSelectButtons

# Activate tooltip effects, optionally only within a specific context.  
# The activation is done cleanly, unbinding any associated events that have been previously bound.
activateTooltips = (selector) ->
  log.trace()
  base = $ selector or document
  base.find('[data-original-title]').each ->
    $this = $ this
    $this.tooltip 'destroy'
    $this.attr 'title', $this.attr 'data-original-title'
    $this.removeAttr 'data-original-title'
  base.find('[title]').each ->
    $this     = $ this
    placement = $this.attr 'data-placement'
    placement = if placement? then trimToLower placement else 'top'
    $this.tooltip
      container: $this.attr('data-container') ? 'body'
      placement: placement

# Convenient shorthand for setting the current context to `null`.
clearContext = ->
  do setContext

# Clear the current context and close the order wizard.
closeWizard = ->
  do clearContext
  $('#order_wizard').modal 'hide'

# Create a order based on the current context and the information derived from the wizard fields.
deriveOrder = ->
  log.trace()
  order =
    code:        $('#order_code').val().trim()
    label:       $('#order_label').val().trim()
    number:      $('#order_number').val().trim()
    error:       activeOrder.error ? ''
    index:       activeOrder.index ? ext.orders.length
    key:         activeOrder.key
    trackingUrl: activeOrder.trackingUrl ? ''
    updates:     activeOrder.updates ? []
  log.debug 'Following order was derived...', order
  order

# Add the user feedback feature to the page.
feedback = ->
  log.trace()
  unless feedbackAdded
    # Continue with normal process of loading Widget.
    uv       = document.createElement 'script'
    uv.async = 'async'
    uv.src   = "https://widget.uservoice.com/#{ext.config.options.userVoice.id}.js"
    script = document.getElementsByTagName('script')[0]
    script.parentNode.insertBefore uv, script
    # Configure the widget as it's loading.
    UserVoice = window.UserVoice or= []
    UserVoice.push [
      'showTab'
      'classic_widget'
      {
        mode:          'full'
        primary_color: '#333'
        link_color:    '#08c'
        default_mode:  'feedback'
        forum_id:      ext.config.options.userVoice.forum
        tab_label:     i18n.get 'opt_feedback_button'
        tab_color:     '#333'
        tab_position:  'middle-left'
        tab_inverted:  yes
      }
    ]
    feedbackAdded = yes

# Retrieve all currently selected orders.
getSelectedOrders = ->
  selectedKeys = []
  $('#orders tbody :checkbox:checked').each ->
    selectedKeys.push $(this).val()
  ext.queryOrders (order) -> order.key in selectedKeys

# Open the order wizard after optionally setting the current context.
openWizard = (order) ->
  setContext order if arguments.length
  $('#order_wizard').modal 'show'

# Update the pagination UI for the specified `orders`.
paginate = (orders) ->
  log.trace()
  limit      = parseInt $('#order_filter').val(), 10
  pagination = $ '#pagination'
  if orders.length > limit > 0
    children = pagination.find 'ul li'
    pages    = Math.ceil orders.length / limit
    # Refresh the pagination link states based on the new `page`.
    refreshPagination = (page = 1) ->
      # Select and display the desired orders subset.
      start = limit * (page - 1)
      end   = start + limit
      loadOrderRows orders[start...end], no
      # Ensure the *previous* link is only enabled when a previous page exists.
      pagination.find('ul li:first-child').each ->
        $this = $ this
        if page is 1 then $this.addClass 'disabled'
        else $this.removeClass 'disabled'
      # Ensure only the active page is highlighted.
      pagination.find('ul li:not(:first-child, :last-child)').each ->
        $this = $ this
        if page is parseInt $this.text(), 10 then $this.addClass 'active'
        else $this.removeClass 'active'
      # Ensure the *next* link is only enabled when a next page exists.
      pagination.find('ul li:last-child').each ->
        $this = $ this
        if page is pages then $this.addClass 'disabled'
        else $this.removeClass 'disabled'
    # Create and insert pagination links.
    if pages isnt children.length - 2
      children.remove()
      list = pagination.find 'ul'
      list.append $('<li/>').append $ '<a>&laquo;</a>'
      for page in [1..pages]
        list.append $('<li/>').append $ "<a>#{page}</a>"
      list.append $('<li/>').append $ '<a>&raquo;</a>'
    # Bind event handlers to manage navigating pages.
    pagination.find('ul li').off 'click'
    pagination.find('ul li:first-child').on 'click', ->
      unless $(this).hasClass 'disabled'
        refreshPagination pagination.find('ul li.active').index() - 1
    pagination.find('ul li:not(:first-child, :last-child)').on 'click', ->
      $this = $ this
      refreshPagination $this.index() unless $this.hasClass 'active'
    pagination.find('ul li:last-child').on 'click', ->
      unless $(this).hasClass 'disabled'
        refreshPagination pagination.find('ul li.active').index() + 1
    do refreshPagination
    pagination.show()
  else
    # Hide the pagination and remove all links as the results fit on a single page.
    pagination.hide().find('ul li').remove()

# Update the state of the reset button depending on the current search input.
refreshResetButton = ->
  log.trace()
  container   = $ '#order_search'
  resetButton = container.find ':reset'
  if container.find(':text').val()
    container.addClass 'input-prepend'
    resetButton.show()
  else
    resetButton.hide()
    container.removeClass 'input-prepend'

# Update the state of certain buttons depending on whether any select boxes have been checked.
refreshSelectButtons = ->
  log.trace()
  selections = $ '#orders tbody :checkbox:checked'
  $('#delete_btn').prop 'disabled', selections.length is 0

# Reset the wizard field values based on the current context.
resetWizard = ->
  log.trace()
  activeOrder ?= {}
  $('#order_wizard .modal-header h3').html if activeOrder.key?
    i18n.get 'opt_order_modify_title', activeOrder.label
  else
    i18n.get 'opt_order_new_header'
  # Assign values to their respective fields.
  $('#order_code').val activeOrder.code or ''
  $('#order_label').val activeOrder.label or ''
  $('#order_number').val activeOrder.number or ''
  $('#order_delete_btn').each ->
    $this = $ this
    if activeOrder.key? then $this.show() else $this.hide()

# Search the orders for the specified `query` and filter those displayed.
searchOrders = (query = '') ->
  log.trace()
  keywords = query.replace(R_CLEAN_QUERY, '').split R_WHITESPACE
  if keywords.length
    expression    = ///
      #{(keyword for keyword in keywords when keyword).join '|'}
    ///i
    searchResults = ext.queryOrders (order) ->
      expression.test "#{order.code} #{order.label} #{order.number}"
  else
    searchResults = null
  loadOrderRows searchResults ? ext.orders
  do refreshResetButton
  do refreshSelectButtons

# Set the current context of the order wizard.
setContext = (order = {}) ->
  log.trace()
  activeOrder = {}
  $.extend activeOrder, order
  do resetWizard

# Convenient shorthand for safely trimming a string to lower case.
trimToLower = (str = '') ->
  str.trim().toLowerCase()

# Convenient shorthand for safely trimming a string to upper case.
trimToUpper = (str = '') ->
  str.trim().toUpperCase()

# Options page setup
# ------------------

options = window.options = new class Options extends utils.Class

  # Public functions
  # ----------------

  # Initialize the options page.  
  # This will involve inserting and configuring the UI elements as well as loading the current
  # settings.
  init: ->
    log.trace()
    log.info 'Initializing the options page'
    # Add support for analytics if the user hasn't opted out.
    analytics.add() if store.get 'analytics'
    # Add the user feedback feature to the page.
    do feedback
    # Begin initialization.
    i18n.init()
    $('.year-repl').html "#{new Date().getFullYear()}"
    # Bind tab selection event to all tabs.
    initialTabChange = yes
    $('a[tabify]').on 'click', ->
      target = $(this).attr 'tabify'
      nav    = $ "#navigation a[tabify='#{target}']"
      parent = nav.parent 'li'
      unless parent.hasClass 'active'
        parent.siblings().removeClass 'active'
        parent.addClass 'active'
        $(target).show().siblings('.tab').hide()
        id = nav.attr 'id'
        store.set 'options_active_tab', id
        unless initialTabChange
          id = id.match(/(\S*)_nav$/)[1]
          id = id[0].toUpperCase() + id.substr 1
          log.debug "Changing tab to #{id}"
          analytics.track 'Tabs', 'Changed', id
        initialTabChange = no
        $(document.body).scrollTop 0
    # Reflect the persisted tab.
    store.init 'options_active_tab', 'general_nav'
    optionsActiveTab = store.get 'options_active_tab'
    $("##{optionsActiveTab}").trigger 'click'
    log.debug "Initially displaying tab for #{optionsActiveTab}"
    # Bind Developer Tools wizard events to their corresponding elements.
    $('#tools_nav').on 'click', ->
      $('#tools_wizard').modal 'show'
    $('.tools_close_btn').on 'click', ->
      $('#tools_wizard').modal 'hide'
    # Ensure that form submissions don't reload the page.
    $('form:not([target="_blank"])').on 'submit', -> no
    # Bind analytical tracking events to key footer buttons and links.
    $('footer a[href*="neocotic.com"]').on 'click', ->
      analytics.track 'Footer', 'Clicked', 'Homepage'
    # Setup and configure the donation button in the footer.
    $('#donation input[name="hosted_button_id"]').val ext.config.options.payPal
    $('#donation').on 'submit', ->
      analytics.track 'Footer', 'Clicked', 'Donate'
    # Load the current option values.
    do load
    # Initialize all popovers, tooltips and *go-to* links.
    $('[popover]').each ->
      $this     = $ this
      placement = $this.attr 'data-placement'
      placement = if placement? then trimToLower placement else 'right'
      trigger   = $this.attr 'data-trigger'
      trigger   = if trigger? then trimToLower trigger else 'hover'
      $this.popover
        content:   -> i18n.get $this.attr 'popover'
        html:      yes
        placement: placement
        trigger:   trigger
      if trigger is 'manual'
        $this.on 'click', ->
          $this.popover 'toggle'
    do activateTooltips
    navHeight = $('.navbar').height()
    $('[data-goto]').on 'click', ->
      goto = $ $(this).attr 'data-goto'
      pos  = goto.position()?.top or 0
      pos -= navHeight if pos and pos >= navHeight
      log.debug "Relocating view to include '#{goto.selector}' at #{pos}"
      $(window).scrollTop pos

  # Ensure that the persisted tab is currently visible.  
  # This should be called if the user clicks the Options link in the popup while and options page
  # is already open.
  refresh: ->
    $("##{store.get 'options_active_tab'}").trigger 'click'

# Initialize `options` when the DOM is ready.
utils.ready -> options.init()
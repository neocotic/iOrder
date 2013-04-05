# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

# Private variables
# -----------------

# Easily accessible reference analytics, internationalization, logging, store, utilities, and to
# the extension controller.
{analytics, ext, i18n, log, store, utils} = chrome.extension.getBackgroundPage()

# Private functions
# -----------------

# Add a `handler` to all selected elements for the specified `event`.
addEventHandlers = (selector, event, handler) ->
  log.trace()
  elements = document.querySelectorAll selector
  element.addEventListener event, handler for element in elements

# Send a message to open the Orders tab on the options page.
openOptions = ->
  log.trace()
  suffix = '_nav'
  tab    = @getAttribute 'data-options-tab'
  if tab
    tab += suffix if tab.indexOf(suffix) isnt tab.length - suffix.length
    store.set 'options_active_tab', tab
  sendMessage 'options', yes

# Send a message to the background page using the information provided.
sendMessage = (type, closeAfter, data = {}, element) ->
  log.trace()
  # Extract the related order data from the element, where possible.
  data.key = element.getAttribute 'data-order-key' if element
  # Send the message to the background page.
  message = {data, type}
  log.debug 'Sending the following message to the extension controller', message
  utils.sendMessage 'extension', message
  # Close this pesky popup.
  do close if closeAfter

# Reflect the state of orders and update processes in specific elements.
updateStates = ->
  log.trace()
  leftButtonGroup = document.querySelector '.btn-toolbar .btn-group:last-child'
  # Left button group must be cleared first and the refresh and clear buttons created and added
  # programmatically to avoid visual issues (e.g. straight edges).
  leftButtonGroup.innerHTML = ''
  # Refresh button should only be visible when orders exist.
  if ext.orders.length
    refreshButton = document.createElement 'button'
    refreshButton.className = 'btn btn-mini'
    refreshButton.id        = 'refreshButton'
    refreshButton.innerHTML = '<i class="icon-refresh"></i>'
    # Refresh button should only be enabled when nothing is currently being updated.
    if ext.isUpdating()
      refreshButton.disabled = yes
      refreshButton.setAttribute 'title', i18n.get 'pop_refresh_button_title_alt'
    else
      refreshButton.setAttribute 'title', i18n.get 'pop_refresh_button_title'
    leftButtonGroup.appendChild refreshButton
  # Clear button should only be visible when order updates were detected and the user has enabled
  # the badges setting (which is enabled by default).
  if ext.hasUpdates() and store.get 'notifications.badges'
    clearButton = document.createElement 'button'
    clearButton.className = 'btn btn-mini'
    clearButton.id        = 'clearButton'
    clearButton.innerHTML = '<i class="icon-trash"></i>'
    clearButton.setAttribute 'title', i18n.get 'pop_clear_button_title'
    leftButtonGroup.appendChild clearButton
  errorIndicator = document.getElementById 'errorIndicator'
  # Error indicator should only be visible when there was an error when updating any of the orders.
  if ext.hasErrors()
    errorIndicator.classList.remove 'hide'
  else
    errorIndicator.classList.add 'hide'
  frequency = document.getElementById 'frequency'
  # Update frequency should only be visible when not disabled.
  if store.get('frequency') > 0
    frequency.classList.remove 'hide'
  else
    frequency.classList.add 'hide'

# Popup page setup
# ----------------

popup = window.popup = new class Popup extends utils.Class

  # Public functions
  # ----------------

  # Initialize the popup page.
  init: ->
    log.trace()
    if @initialized
      log.info 'Re-initializing the popup'
    else
      log.info 'Initializing the popup'
      analytics.track 'Frames', 'Displayed', 'Popup'
    # Begin (re-)initialization.  
    # Temporarily reuse the `i18n` in the background page while ensuring to reset the root node
    # once done with it, ignoring any possible errors.
    oldNode = i18n.manager.node
    i18n.manager.node = document
    try
      i18n.init
        frequency:   pop_footer_frequency_text:    ext.getFrequency()?.text
        lastUpdated: pop_footer_last_updated_text: ext.getTimeAgoHtml store.get 'lastUpdated'
    finally
      i18n.manager.node = oldNode
    do updateStates
    # Bind click events to general buttons.
    addEventHandlers '#refreshButton', 'click', ->
      sendMessage 'refresh'
    addEventHandlers '#clearButton', 'click', ->
      sendMessage 'clear'
    unless @initialized
      addEventHandlers '#optionsButton', 'click', openOptions
      addEventHandlers '#ordersButton', 'click', ->
        sendMessage 'viewAll', yes
    # Insert the prepared HTML in to the popup's table body before binding their click events.
    document.querySelector('#orders tbody').innerHTML = ext.ordersHtml
    addEventHandlers '#noOrdersLink', 'click', openOptions
    addEventHandlers '#orders a[data-order-action]', 'click', ->
      sendMessage @getAttribute('data-order-action'), yes, null, this
    @initialized = yes
    document.body.classList.remove 'hide'

# Initialize `popup` when the DOM is ready.
utils.ready this, -> popup.init()
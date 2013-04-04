# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

# Private variables
# -----------------

# Easily accessible reference analytics, logging, store, utilities, and to the extension
# controller.
{analytics, ext, log, store, utils} = chrome.extension.getBackgroundPage()

# Private functions
# -----------------

# Add a `handler` to all selected elements for the specified `event`.
addEventHandler = (selector, event, handler, context = document) ->
  log.trace()
  elements = context.querySelectorAll selector
  element.addEventListener event, handler for element in elements

# Send a message to the background page using the information provided.
sendMessage = (type, closeAfter, data = {}, element) ->
  log.trace()
  # Extract the related order data from the element, where possible.
  data.number = element.getAttribute 'data-order-number' if element
  # Send the message to the background page.
  message = {data, type}
  log.debug 'Sending the following message to the extension controller', message
  utils.sendMessage 'extension', message
  # Close this pesky popup.
  window.close() if closeAfter

# Popup page setup
# ----------------

popup = window.popup = new class Popup extends utils.Class

  # Public functions
  # ----------------

  # Send a message to clear any badge being displayed.
  clear: ->
    log.trace()
    sendMessage 'clear'

  # Initialize the popup page.
  init: ->
    log.trace()
    log.info 'Initializing the popup'
    analytics.track 'Frames', 'Displayed', 'Popup'
    # Insert the prepared HTML in to the popup's body and bind click events.
    document.body.innerHTML = ext.popupHtml
    addEventHandler '#optionsLink',  'click', popup.options
    addEventHandler '#ordersLink',   'click', popup.viewAll
    addEventHandler '#clearLink',    'click', popup.clear
    addEventHandler '#noOrdersLink', 'click', popup.options
    addEventHandler '#refreshLink',  'click', popup.refresh
    for orderRow in document.querySelectorAll '#orders tbody tr'
      addEventHandler 'td:first-child a', 'click', popup.view,  orderRow
      addEventHandler 'td:last-child a',  'click', popup.track, orderRow

  # Send a message to open the Orders tab on the options page.
  options: ->
    log.trace()
    suffix = '_nav'
    tab    = @getAttribute 'data-options-tab'
    if tab
      tab += suffix if tab.indexOf(suffix) isnt tab.length - suffix.length
      store.set 'options_active_tab', tab
    sendMessage 'options', yes

  # Send a message to update the orders immediately.
  refresh: ->
    log.trace()
    sendMessage 'refresh'

  # Send a message to open the tracking page for the order relating to the clicked link.
  track: ->
    log.trace()
    sendMessage 'track', yes, {}, this

  # Send a message to open the page on the Apple US store for the order relating to the clicked
  # link.
  view: ->
    log.trace()
    sendMessage 'view', yes, {}, this

  # Send a message to open the order listing page on the Apple US store.
  viewAll: ->
    log.trace()
    sendMessage 'viewAll', yes

# Initialize `popup` when the DOM is ready.
utils.ready this, -> popup.init()
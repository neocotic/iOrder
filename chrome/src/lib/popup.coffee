# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

#### Private variables

# Easily accessible reference to the extension controller.
{ext} = chrome.extension.getBackgroundPage()

#### Private functions

# Add a `handler` to all selected elements for the specified `event`.
addEventHandler = (selector, event, handler, context = document) ->
  elements = context.querySelectorAll selector
  element.addEventListener event, handler for element in elements

# Send a message to the background page using the information provided.
sendMessage = (type, closeAfter, data = {}, element) ->
  # Extract the related order data from the element, where possible.
  if element
    data.code   = element.getAttribute 'data-order-code'
    data.number = element.getAttribute 'data-order-number'
  # Send the message to the background page.
  utils.sendMessage 'extension', data: data, type: type
  # Close this pesky popup.
  window.close() if closeAfter

#### Popup page setup

popup = window.popup =

  #### Public functions

  # Send a message to clear any badge being displayed.
  clear: ->
    sendMessage 'clear'

  # Initialize the popup page.
  init: ->
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
    suffix = '_nav'
    tab    = @getAttribute 'data-options-tab'
    if tab
      tab += suffix if tab.indexOf(suffix) isnt tab.length - suffix.length
      utils.set 'options_active_tab', tab
    sendMessage 'options', yes

  # Send a message to update the orders immediately.
  refresh: ->
    sendMessage 'refresh'

  # Send a message to open the tracking page for the order relating to the
  # clicked link.
  track: ->
    sendMessage 'track', yes, {}, this

  # Send a message to open the page on the Apple US store for the order
  # relating to the clicked link.
  view: ->
    sendMessage 'view', yes, {}, this

  # Send a message to open the order listing page on the Apple US store.
  viewAll: ->
    sendMessage 'viewAll', yes


# Initialize `popup` when the DOM is ready.
utils.ready -> popup.init()

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

# Send a request to the background page using the information provided.
sendRequest = (type, closeAfter, data = {}, element) ->
  # Extract the related order data from the element, where possible.
  if element
    data.code   = element.getAttribute 'data-order-code'
    data.number = element.getAttribute 'data-order-number'
  # Send the request to the background page.
  chrome.extension.sendRequest data: data, type: type
  # Close this pesky popup.
  window.close() if closeAfter

#### Popup page setup

popup = window.popup =

  #### Public functions

  # Send a request to clear any badge being displayed.
  clear: ->
    sendRequest 'clear'

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

  # Send a request to open the Orders tab on the options page.
  options: ->
    suffix = '_nav'
    tab    = @getAttribute 'data-options-tab'
    if tab
      tab += suffix if tab.indexOf(suffix) isnt tab.length - suffix.length
      utils.set 'options_active_tab', tab
    sendRequest 'options', yes

  # Send a request to update the orders immediately.
  refresh: ->
    sendRequest 'refresh'

  # Send a request to open the tracking page for the order relating to the
  # clicked link.
  track: ->
    sendRequest 'track', yes, {}, this

  # Send a request to open the page on the Apple US store for the order
  # relating to the clicked link.
  view: ->
    sendRequest 'view', yes, {}, this

  # Send a request to open the order listing page on the Apple US store.
  viewAll: ->
    sendRequest 'viewAll', yes


# Initialize `popup` when the DOM is ready.
utils.ready -> popup.init()
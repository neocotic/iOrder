# [iOrder](http://neocotic.com/iOrder)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

#### Private variables

# Easily accessible reference to the extension controller.
ext = chrome.extension.getBackgroundPage().ext

#### Private functions

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
    # Insert the prepared HTML in to the popup's body.
    document.body.innerHTML = ext.popupHtml

  # Send a request to open the Orders tab on the options page.
  options: (tab) ->
    suffix = '_nav'
    if tab
      tab += suffix if tab.indexOf(suffix) isnt tab.length - suffix.length
      utils.set 'options_active_tab', tab
    sendRequest 'options', yes

  # Send a request to update the orders immediately.
  refresh: ->
    sendRequest 'refresh'

  # Send a request to open the tracking page for the order relating to the
  # clicked link.
  track: (element) ->
    sendRequest 'track', yes, {}, element

  # Send a request to open the page on the Apple US store for the order
  # relating to the clicked link.
  view: (element) ->
    sendRequest 'view', yes, {}, element

  # Send a request to open the order listing page on the Apple US store.
  viewAll: ->
    sendRequest 'viewAll', yes
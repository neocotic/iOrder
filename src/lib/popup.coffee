# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

#### Private variables

# Easily accessible reference to the extension controller.
{ext} = chrome.extension.getBackgroundPage()

#### Private functions

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
    # Insert the prepared HTML in to the popup's body.
    document.body.innerHTML = ext.popupHtml

  # Send a message to open the Orders tab on the options page.
  options: (tab) ->
    suffix = '_nav'
    if tab
      tab += suffix if tab.indexOf(suffix) isnt tab.length - suffix.length
      utils.set 'options_active_tab', tab
    sendMessage 'options', yes

  # Send a message to update the orders immediately.
  refresh: ->
    sendMessage 'refresh'

  # Send a message to open the tracking page for the order relating to the
  # clicked link.
  track: (element) ->
    sendMessage 'track', yes, {}, element

  # Send a message to open the page on the Apple US store for the order
  # relating to the clicked link.
  view: (element) ->
    sendMessage 'view', yes, {}, element

  # Send a message to open the order listing page on the Apple US store.
  viewAll: ->
    sendMessage 'viewAll', yes
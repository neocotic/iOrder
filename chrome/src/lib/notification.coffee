# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

# Private variables
# -----------------

# Easily accessible reference to analytics, logging, storage, utilities, and the extension
# controller.
{analytics, ext, log, store, utils} = chrome.extension.getBackgroundPage()

# Private functions
# -----------------

# Build the HTML or create the elements to be displayed within the notification.
buildContents = ->
  log.trace()
  data = ext.notification ? {}
  log.debug 'Building a desktop notfication for the following data...', data
  if data.html
    document.body.innerHTML = data.html
  else
    if data.icon
      icon = document.createElement 'div'
      icon.id = 'icon'
      icon.style.cssText = data.iconStyle if data.iconStyle
      image = document.createElement 'img'
      image.src    = data.icon
      image.width  = 32
      image.height = 32
      icon.appendChild image
      document.body.appendChild icon
    if data.title
      title = document.createElement 'div'
      title.id        = 'title'
      title.innerHTML = data.title
      title.style.cssText = data.titleStyle if data.titleStyle
      document.body.appendChild title
    if data.description
      description = document.createElement 'div'
      description.id        = 'description'
      description.innerHTML = data.description
      description.style.cssText = data.descriptionStyle if data.descriptionStyle
      document.body.appendChild description

# Notification page setup
# -----------------------

notification = window.notification = new class Notification extends utils.Class

  # Public functions
  # ----------------

  # Initialize the notification page.
  init: ->
    log.trace()
    log.info 'Initializing a notification'
    analytics.track 'Frames', 'Displayed', 'Notification'
    # Populate the desktop notification.  
    # Afterwards, reset `ext` to avoid affecting other update processes. If the user has disabled
    # the notifications option this should still be called for safety.
    do buildContents
    ext.reset()
    # Set a timer to close the notification after a specified period of time, if the user enabled
    # the corresponding option; otherwise it should stay open until it is closed manually by the
    # user.
    duration = store.get 'notifications.duration'
    setTimeout (-> do close), duration if duration > 0

# Initialize `notification` when the DOM is ready.
utils.ready this, -> notification.init()
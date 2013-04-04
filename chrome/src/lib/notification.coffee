# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

# Private variables
# -----------------

# Easily accessible reference to analytics, internationalization, logging, storage, and utilities.
{analytics, i18n, log, store, utils} = chrome.extension.getBackgroundPage()

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
    i18n.init()
    # Set a timer to close the notification after a specified period of time, if the user enabled
    # the corresponding option; otherwise it should stay open until it is closed manually by the
    # user.
    duration = store.get 'notifications.duration'
    setTimeout (-> do close), duration if duration > 0

# Initialize `notification` when the DOM is ready.
utils.ready this, -> notification.init()
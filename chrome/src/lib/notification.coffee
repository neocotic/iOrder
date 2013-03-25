# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

# Private variables
# -----------------

# Easily accessible reference to internationalization, store, and utilities.
{i18n, store, utils} = chrome.extension.getBackgroundPage()

# Notification page setup
# -----------------------

notification = window.notification = new class Notification extends utils.Class

  # Public functions
  # ----------------

  # Initialize the notification page.
  init: ->
    i18n.init()
    duration = store.get 'notificationDuration'
    # Set a timer to close the notification after a specified period of time, if user enabled the
    # corresponding option; otherwise it should stay open until it is closed manually by user.
    if duration > 0
      window.setTimeout ->
        window.close()
      , duration

# Initialize `notification` when the DOM is ready.
utils.ready this, -> notification.init()
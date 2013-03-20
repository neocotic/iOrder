# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

#### Notification page setup

notification = window.notification =

  #### Public functions

  # Initialize the notification page.
  init: ->
    utils.i18nSetup()
    duration = utils.get 'notificationDuration'
    # Set a timer to close the notification after a specified period of time, if
    # user enabled the corresponding option; otherwise it should stay open until
    # it is closed manually by user.
    if duration > 0
      window.setTimeout ->
        window.close()
      , duration
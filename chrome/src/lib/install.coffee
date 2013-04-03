# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

# Helpers
# -------

# Convenient shorthand the `sendMessage` method in the chrome API which supports the old
# `sendRequest` variation for backwards compatibility.
sendMessage = (args...) ->
  base = chrome.extension
  (base.sendMessage or base.sendRequest).apply base, args

# Functionality
# -------------

# Wrap the functionality in a message for iOrder's details in order to get the ID in use.
sendMessage type: 'info', (data) ->
  # Names of the classes to be added to the targeted elements.
  newClasses = ['disabled']
  # Names of the classes to be removed from the targeted elements.
  oldClasses = ['chrome_install_button']
  # Disable all "Install" links on the homepage for iOrder.
  for link in document.querySelectorAll "a.#{oldClasses[0]}[href$=#{data.id}]"
    link.innerHTML = link.innerHTML.replace 'Install', 'Installed'
    link.classList.add    cls for cls in newClasses
    link.classList.remove cls for cls in oldClasses
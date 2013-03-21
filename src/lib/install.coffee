# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

#### Private variables

# Extension ID of iOrder.
extId      = 'kflemogpkbophbipihnbcmlplbihbdhb'
# Names of the classes to be added to the targeted elements.
newClasses = ['disabled']
# Names of the classes to be removed from the targeted elements.
oldClasses = ['chrome_install_button']

#### Functionality

# Disable all "Install" links on the homepage for Undo Wikipedia Blackout.
for link in document.querySelectorAll "a.#{oldClasses[0]}[href$=#{extId}]"
  link.innerHTML = link.innerHTML.replace 'Install', 'Installed'
  link.classList.add    cls for cls in newClasses
  link.classList.remove cls for cls in oldClasses
# [iOrder](http://neocotic.com/iOrder)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

#### Private functions

# Internationalize the value of the specified element's property.
i18nConvert = (element, property, value, subMap) ->
  # Find an array of substitution strings using the element's ID and the
  # message key as the mapping.
  if subMap
    for prop of subMap when subMap.hasOwnProperty(prop) and prop is element.id
      for subProp of subMap[prop] when subMap[prop].hasOwnProperty subProp
        if subProp is value
          subs = subMap[prop][subProp]
          break
      break
  # Walk the element's properties to find the desired property.
  prop = element
  prop = prop[property] ? {} for property in property.split '.' when prop
  # Lookup and replace actual property's value.
  prop = utils.i18n value, subs if prop

#### Utilities setup

utils = window.utils =

  #### Data functions

  # Determine whether or not the specified key exists in `localStorage`.
  exists: (key) ->
    return localStorage.hasOwnProperty key

  # Retrieve the value associated with the specified key from `localStorage`.  
  # If the value is found, parse it as JSON before being returning it; otherwise
  # return `undefined`.
  get: (key) ->
    value = localStorage[key]
    return if value? then JSON.parse value else value

  # Initialize the value of the specified key in `localStorage`.  
  # If the value is currently `undefined`, assign the specified default value;
  # otherwise reassign itself.
  init: (key, defaultValue) ->
    value = utils.get key
    return utils.set key, value ? defaultValue

  # Remove the specified key from `localStorage`.
  remove: (key) ->
    exists = utils.exists key
    delete localStorage[key]
    return exists

  # Copy the value of the existing key to that of the new key then remove the
  # old key from `localStorage`.  
  # If the old key doesn't exist in `localStorage`, assign the specified default
  # value to it instead.
  rename: (oldKey, newKey, defaultValue) ->
    if utils.exists oldKey
      utils.init newKey, utils.get oldKey
      utils.remove oldKey
    else
      utils.init newKey, defaultValue

  # Set the value of the specified key in `localStorage`.  
  # If the specified value is `undefined`, assign that value directly to the
  # key; otherwise transform it to a JSON string beforehand.
  set: (key, value) ->
    oldValue = utils.get key
    localStorage[key] = if value? then JSON.stringify value else value
    return oldValue

  #### Internationalization functions

  # Convenient shorthand for `chrome.i18n.getMessage`.
  i18n: ->
    chrome.i18n.getMessage.apply chrome.i18n, arguments

  # Internationalize the specified attribute of all the selected elements.
  i18nAttribute: (selector, attribute, value, subs) ->
    elements = document.querySelectorAll selector
    # Ensure the substitution string(s) are in an array.
    subs = [subs] if typeof subs is 'string'
    element[attribute] = utils.i18n value, subs for element in elements

  # Internationalize the contents of all the selected elements.
  i18nContent: (selector, value, subs) ->
    elements = document.querySelectorAll selector
    # Ensure the substitution string(s) are in an array.
    subs = [subs] if typeof subs is 'string'
    element.innerHTML = utils.i18n value, subs for element in elements

  # Perform all internationalization setup required for the current page.
  i18nSetup: (subMap) ->
    elements = document.querySelectorAll('[i18n-content]')
    # Internationalize the contents of all `[i18n-content]` elements.
    for element in elements
      i18nConvert element, 'innerHTML', element['i18n-content'], subMap
      element.removeAttribute 'i18n-content'
    elements = document.querySelectorAll '[i18n-values]'
    # Internationalize the specified properties of all `[i18n.values]` elements.
    for element in elements
      values = element['i18n-values'].split ';'
      for value in values
        mapping = value.split ':'
        if mapping.length is 2
          mapping[0] = mapping[0].substr 1 if mapping[0].indexOf('.') is 0
        i18nConvert element, mapping[0], mapping[1], subMap
      element.removeAttribute 'i18n-values'
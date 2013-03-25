# [iOrder](http://neocotic.com/iOrder)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/iOrder>

# Private classes
# ---------------

# `Class` makes for more readable logs etc. as it overrides `toString` to output the name of the
# implementing class.
class Class

  # Override the default `toString` implementation to provide a cleaner output.
  toString: -> @constructor.name

# Private variables
# -----------------

# Mapping of all timers currently being managed.
timings = {}
# Map of class names to understable types.
typeMap = {}
# Populate the type map for all classes.
[
  'Boolean'
  'Number'
  'String'
  'Function'
  'Array'
  'Date'
  'RegExp'
  'Object'
].forEach (name) ->
  typeMap["[object #{name}]"] = name.toLowerCase()

# Utilities setup
# ---------------

utils = window.utils = new class Utils extends Class

  # Public functions
  # ----------------

  # Create a clone of an object.
  clone: (obj, deep) ->
    return obj unless @isObject obj
    return obj.slice() if @isArray obj
    copy = {}
    for own key, value of obj
      copy[key] = if deep then @clone value, yes else value
    copy

  # Indicate whether an object is an array.
  isArray: Array.isArray or (obj) -> 'array' is @type obj

  # Indicate whether an object is an object.
  isObject: (obj) -> obj is Object obj

  # Convenient shorthand for the different types of `onMessage` methods available in the chrome
  # API.  
  # This also supports the old `onRequest` variations for backwards compatibility.
  onMessage: (type = 'extension', external, args...) ->
    base = chrome[type]
    base = chrome.extension if not base and type is 'runtime'
    if external
      base = base.onMessageExternal or base.onRequestExternal
    else
      base = base.onMessage or base.onRequest
    base.addListener args...

  # Retrieve the first entity/all entities that pass the specified `filter`.
  query: (entities, singular, filter) ->
    if singular
      return entity for entity in entities when filter entity
    else
      entity for entity in entities when filter entity

  # Bind `handler` to event indicating that the DOM is ready.
  ready: (context, handler) ->
    unless handler?
      handler = context
      context = window
    if context.jQuery?
      context.jQuery handler
    else
      context.document.addEventListener 'DOMContentLoaded', handler

  # Convenient shorthand for the different types of `sendMessage` methods available in the chrome
  # API.  
  # This also supports the old `sendRequest` variations for backwards compatibility.
  sendMessage: (type = 'extension', args...) ->
    base = chrome[type]
    base = chrome.extension if not base and type is 'runtime'
    (base.sendMessage or base.sendRequest).apply base, args

  # Start a new timer for the specified `key`.  
  # If a timer already exists for `key`, return the time difference in milliseconds.
  time: (key) ->
    if timings.hasOwnProperty key
      new Date().getTime() - timings[key]
    else
      timings[key] = new Date().getTime()

  # End the timer for the specified `key` and return the time difference in milliseconds and remove
  # the timer.  
  # If no timer exists for `key`, simply return `0'.
  timeEnd: (key) ->
    if timings.hasOwnProperty key
      start = timings[key]
      delete timings[key]
      new Date().getTime() - start
    else
      0

  # Retrieve the understable type name for an object.
  type: (obj) ->
    if obj? then typeMap[Object::toString.call obj] || 'object' else String obj

  # Convenient shorthand for `chrome.extension.getURL`.
  url: -> chrome.extension.getURL arguments...

# Public classes
# --------------

# Objects within the extension should extend this class wherever possible.
utils.Class = Class
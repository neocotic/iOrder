// [iOrder](http://neocotic.com/iOrder)  
// (c) 2011 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/iOrder>

(function (window, undefined) {

  // Private functions
  // -----------------

  // Internationalize the value of the specified element's property.
  function i18nConvert(element, property, value, subMap) {
    var
      prop,
      props = property.split('.'),
      subProp,
      subs;
    // Find an array of substitution strings using the element's ID and the
    // message key as the mapping.
    if (subMap) {
      for (prop in subMap) {
        if (subMap.hasOwnProperty(prop)) {
          if (prop === element.id) {
            for (subProp in subMap[prop]) {
              if (subMap[prop].hasOwnProperty(subProp)) {
                if (subProp === value) {
                  subs = subMap[prop][subProp];
                  break;
                }
              }
            }
            break;
          }
        }
      }
    }
    // Walk the element's properties to find the desired property.
    prop = element;
    for (var i = 0; i < props.length; i++) {
      if (prop) prop = prop[props[i]] || {};
    }
    // Lookup and replace actual property's value.
    if (prop) prop = utils.i18n(value, subs);
  }

  // Utilities setup
  // ---------------

  var utils = window.utils = {

    // Data functions
    // --------------

    // Determine whether or not the specified key exists in `localStorage`.
    exists: function (key) {
      return localStorage.hasOwnProperty(key);
    },

    // Retrieve the value associated with the specified key from
    // `localStorage`.  
    // If the value is found, parse it as JSON before being returning it;
    // otherwise return `undefined`.
    get: function (key) {
      var value = localStorage[key];
      if (value !== undefined) return JSON.parse(value);
      return value;
    },

    // Initialize the value of the specified key in `localStorage`.  
    // If the value is currently `undefined`, assign the specified default
    // value; otherwise reassign itself.
    init: function (key, defaultValue) {
      var value = utils.get(key);
      if (value === undefined) value = defaultValue;
      return utils.set(key, value);
    },

    // Remove the specified key from `localStorage`.
    remove: function (key) {
      var exists = utils.exists(key);
      delete localStorage[key];
      return exists;
    },

    // Copy the value of the existing key to that of the new key then remove
    // the old key from `localStorage`.  
    // If the old key doesn't exist in `localStorage`, assign the specified
    // default value to it instead.
    rename: function (oldKey, newKey, defaultValue) {
      if (utils.exists(oldKey)) {
        utils.init(newKey, utils.get(oldKey));
        utils.remove(oldKey);
      } else {
        utils.init(newKey, defaultValue);
      }
    },

    // Set the value of the specified key in `localStorage`.  
    // If the specified value is `undefined`, assign that value directly to the
    // key; otherwise transform it to a JSON string beforehand.
    set: function (key, value) {
      var oldValue = utils.get(key);
      if (value !== undefined) {
        localStorage[key] = JSON.stringify(value);
      } else {
        localStorage[key] = value;
      }
      return oldValue;
    },

    // Internationalization functions
    // ------------------------------

    // Convenient shorthand for `chrome.i18n.getMessage`.
    i18n: function () {
      chrome.i18n.getMessage.apply(chrome.i18n, arguments);
    },

    // Internationalize the specified attribute of all the selected elements.
    i18nAttribute: function (selector, attribute, value, subs) {
      var elements = document.querySelectorAll(selector);
      // Ensure the substitution string(s) are in an array.
      if (typeof subs === 'string') subs = [subs];
      for (var i = 0; i < elements.length; i++) {
        elements[i][attribute] = utils.i18n(value, subs);
      }
    },

    // Internationalize the contents of all the selected elements.
    i18nContent: function (selector, value, subs) {
      var elements = document.querySelectorAll(selector);
      // Ensure the substitution string(s) are in an array.
      if (typeof subs === 'string') subs = [subs];
      for (var i = 0; i < elements.length; i++) {
        elements[i].innerHTML = utils.i18n(value, subs);
      }
    },

    // Perform all internationalization setup required for the current page.
    i18nSetup: function (subMap) {
      var
        elements = document.querySelectorAll('[i18n-content]'),
        i;
      // Internationalize the contents of all `[i18n-content]` elements.
      for (i = 0; i < elements.length; i++) {
        i18nConvert(elements[i], 'innerHTML', elements[i]['i18n-content'],
            subMap);
        elements[i].removeAttribute('i18n-content');
      }
      elements = document.querySelectorAll('[i18n-values]');
      var j, mapping, values;
      // Internationalize the specified properties of all `[i18n.values]`
      // elements.
      for (i = 0; i < elements.length; i++) {
        values = elements[i]['i18n-values'].split(';');
        for (j = 0; j < values.length; j++) {
          mapping = values[j].split(':');
          if (mapping.length === 2) {
            if (mapping[0].indexOf('.') === 0) {
              mapping[0] = mapping[0].substr(1);
            }
            i18nConvert(elements[i], mapping[0], mapping[1], subMap);
          }
        }
        elements[i].removeAttribute('i18n-values');
      }
    }

  };

}(this));
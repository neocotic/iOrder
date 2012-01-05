// [iOrder](http://neocotic.com/iOrder)  
// (c) 2012 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/iOrder>

(function (window, undefined) {

  // Private variables
  // -----------------

  var
    // Names of the classes to be removed from the targeted elements.
    classNames = ['chrome_install_button', 'primary'],
    // "Install" links to be modified.
    links      = document.querySelectorAll('a.' + classNames[0] + '[href$=' +
                     'kflemogpkbophbipihnbcmlplbihbdhb]');

  // Functionality
  // -------------

  // Disable all "Install" links on the homepage for iOrder.
  for (var i = 0; i < links.length; i++) {
    links[i].className += ' disabled';
    links[i].innerText = 'Installed';
    for (var j = 0; j < classNames.length; j++) {
      links[i].className = links[i].className.replace(classNames[j], '');
    }
  }

}(this));
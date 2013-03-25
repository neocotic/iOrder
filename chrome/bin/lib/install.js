// [iOrder](http://neocotic.com/iOrder)
// (c) 2013 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/iOrder>
(function() {
  var cls, extId, link, newClasses, oldClasses, _i, _j, _k, _len, _len1, _len2, _ref;

  extId = 'kflemogpkbophbipihnbcmlplbihbdhb';

  newClasses = ['disabled'];

  oldClasses = ['chrome_install_button'];

  _ref = document.querySelectorAll("a." + oldClasses[0] + "[href$=" + extId + "]");
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    link = _ref[_i];
    link.innerHTML = link.innerHTML.replace('Install', 'Installed');
    for (_j = 0, _len1 = newClasses.length; _j < _len1; _j++) {
      cls = newClasses[_j];
      link.classList.add(cls);
    }
    for (_k = 0, _len2 = oldClasses.length; _k < _len2; _k++) {
      cls = oldClasses[_k];
      link.classList.remove(cls);
    }
  }

}).call(this);

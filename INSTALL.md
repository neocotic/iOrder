# Build Requirements
In order to build [iOrder][], you need to have the following:

* [CoffeeScript][] 1.1+
* [docco][] 0.3+
* [UglifyJS][] 1.2+
* [git][] 1.7+

*Earlier versions might work, but have not been tested.*

1. Install [git][]
2. Install [Node](http://nodejs.org/#download)
3. Using [npm][] install [CoffeeScript][], [docco][], [UglifyJS][], and all their dependencies

# Building
Follow these steps to build [iOrder][];

1. Clone a copy of the main [iOrder git repository](https://github.com/neocotic/iOrder) by running `git clone git://github.com/neocotic/iOrder.git`
2. For the minified version `cd` to the repository directory and enter `cake build`
   * If you don't have any of the build dependencies installed and/or want the basic, uncompressed, version of [iOrder][], simply run the extension off of the `src` directory
   * Outputs to `bin` directory
3. For the distribution enter `cake dist`
   * Outputs to `dist` directory

If you want to generate documentation as well you can do the following after step 1 of the above;

1. `cd` to the repository directory and enter `cake docs`
   * Outputs to `docs` directory

To remove all built files, run `cake clean`.

# Debugging
To run the locally built extension in [Google Chrome][] you can follow these steps;

1. Launch Google Chrome
2. Bring up the extensions management page by clicking the wrench icon ![wrench](http://code.google.com/chrome/extensions/images/toolsmenu.gif) and choosing **Tools > Extensions**
3. If **Developer mode** has a + by it, click the + to add developer information to the page (the + changes to a -, and more buttons and information appear)
4. If any other installations of the extension exist either **Disable** or **Uninstall** them
4. Click the **Load unpacked extension** button (a file dialog appears)
5. In the file dialog, navigate to the extension's `bin` or `src` folder and click **OK**

[coffeescript]: http://coffeescript.org
[docco]: https://github.com/jashkenas/docco
[git]: http://git-scm.com
[google chrome]: http://www.google.com/chrome
[iorder]: http://neocotic.com/iOrder
[node]: http://nodejs.org
[npm]: http://npmjs.org
[uglifyjs]: https://github.com/mishoo/UglifyJS
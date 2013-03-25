# Build Requirements
In order to build [iOrder][] for your browser(s), you need to have the following install [git][]
1.7+ and the latest version of [node.js][] 0.8+ (which includes [npm][]).

# Building
## All
Follow these steps to build [iOrder][] for all browsers;

1. Clone a copy of the main [iOrder git repository](https://github.com/neocotic/iOrder) by running `git clone git://github.com/neocotic/iOrder.git`
2. `cd` to the repository directory
3. Ensure you have all of the dependencies by entering `npm install`
4. To update the compiled and runnable versions enter `cake build`
   * Outputs to the `bin` sub-directory within each browsers directory
5. To update the optimized distributable files enter `cake dist`
   * Outputs to the `dist` sub-directory within each browsers directory
6. To update the documentation enter `cake docs`
   * Outputs to the `docs` sub-directory within each browsers directory
   * Not currently working on Windows as it uses linux shell commands

## Individually
Follow these steps to build [iOrder][] for a specific browser;

1. Complete steps 1-3 for building *All* browsers
2. To update the compiled and runnable versions enter `cake build-<browser>`
   * Outputs to the `bin` sub-directory within the browsers directory
3. To update the optimized distributable files enter `cake dist-<browser>`
   * Outputs to the `dist` directory within the browsers directory
4. To update the documentation enter `cake docs-<browser>`
   * Outputs to the `docs` directory within the browsers directory
   * Not currently working on Windows as it uses linux shell commands

In each of these steps `<browser>` should be replaced with the name of the browser to be built.

However, it is always recommended that you read the `INSTALL.md` file within each browsers
sub-directory for building and installing specific browser versions.

[git]: http://git-scm.com
[iorder]: http://neocotic.com/iOrder
[node.js]: http://nodejs.org
[npm]: http://npmjs.org
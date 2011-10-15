dist_file = iOrder

js_engine ?= `which node`
jsdoc_toolkit = /usr/local/jsdoc-toolkit
compiler = $(js_engine) build/uglify.js --ascii --no-copyright --no-dead-code --no-seqs
post_compiler = $(js_engine) build/post-compile.js
validator = $(js_engine) build/jslint-check.js

base_files = src/js/background.js\
	src/js/options.js\
	src/js/popup.js\
	src/js/utils.js

base_bin_files = $(subst src/,bin/,$(base_files))
base_dirs = bin\
	bin/_locales\
	bin/images\
	bin/js\
	bin/pages
base_locale_dirs = bin/_locales/en

all: core

core: iorder $(base_bin_files)
	@@echo "iOrder build complete"

iorder: $(base_dirs) $(base_locale_dirs)
	@@echo "Building iOrder"
	@@mkdir -p bin
	@@cp -r src/* bin
	@@find bin/ -name '.git*' -print0 | xargs -0 -IFILES rm FILES

$(base_bin_files): iorder
	@@if test ! -z $(js_engine); then \
		echo "Validating:" $@; \
		$(validator) $@; \
		echo "Minifying:" $@; \
		$(compiler) $@ > $@.tmp; \
		$(post_compiler) $@.tmp > $@; \
		rm -f $@.tmp; \
	else \
		echo "You must have NodeJS installed in order to validate and minify" $(notdir $@); \
	fi

$(base_dirs):
	@@mkdir -p $@

$(base_locale_dirs):
	@@mkdir -p $@

doc:
	@@echo "Generating documentation"
	@@mkdir -p docs
	@@java -jar $(jsdoc_toolkit)/jsrun.jar $(jsdoc_toolkit)/app/run.js -q -p -d=docs \
		-t=$(jsdoc_toolkit)/templates/jsdoc $(base_files)

dist:
	@@echo "Generating distributable"
	@@mkdir -p dist
	@@cd bin && zip -r ../dist/$(dist_file) *
	@@echo "iOrder distributable complete"

distclean: docclean
	@@echo "Removing distribution directory"
	@@rm -rf dist

docclean:
	@@echo "Removing documentation directory"
	@@rm -rf docs

clean: distclean
	@@echo "Removing binary directory"
	@@rm -rf bin

.PHONY: all iorder doc dist clean distclean docclean core
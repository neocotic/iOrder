dist_file = iOrder

docco ?= `which docco`
docco_cmd = $(docco)
uglifyjs ?= `which uglifyjs`
uglifyjs_cmd = $(uglifyjs) --ascii --no-dead-code --no-seqs

base_files = src/js/background.js\
	src/js/install.js\
	src/js/notification.js\
	src/js/options.js\
	src/js/popup.js\
	src/js/utils.js

base_bin_files = $(subst src/,bin/,$(base_files))
base_dirs = bin\
	bin/_locales\
	bin/_locales/en\
	bin/images\
	bin/js\
	bin/pages

all: core

core: iorder $(base_bin_files)
	@@echo "Build complete!"

iorder: $(base_dirs)
	@@echo "Building iOrder..."
	@@mkdir -p bin
	@@cp -r src/* bin
	@@find bin/ -name '.git*' -print0 | xargs -0 -IFILES rm FILES

$(base_bin_files): iorder
	@@if test ! -z $(uglifyjs); then \
		echo "Minifying:" $@; \
		$(uglifyjs_cmd) $@ > $@.tmp; \
		mv -f $@.tmp $@; \
		rm -f $@.tmp; \
	else \
		echo "You must have UglifyJS installed in order to minify" $(notdir $@); \
	fi

$(base_dirs):
	@@mkdir -p $@

docs:
	@@if test ! -z $(docco); then \
		echo "Generating documentation..."; \
		$(docco_cmd) $(base_files); \
	else \
		echo "You must have docco installed in order to generate documentation"; \
	fi

dist:
	@@echo "Generating distributable..."
	@@mkdir -p dist
	@@cd bin && zip -r ../dist/$(dist_file) *

clean:
	@@echo "Removing generated directories..."
	@@rm -rf bin
	@@rm -rf dist

.PHONY: all iorder docs dist clean core
#!/usr/bin/env bash

rm -rf release/zip
mkdir release/zip

# Zip executables for distribution.
zip -9 release/zip/$3-$2-linux-x64.zip release/bin/$1-$2#linux-x64
zip -9 release/zip/$3-$2-darwin-x64.zip release/bin/$1-$2#darwin-x64
zip -9 release/zip/$3-$2-win32-x64.zip release/bin/$1-$2#win32-x64.exe

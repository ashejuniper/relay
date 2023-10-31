#!/usr/bin/env bash

echo Renaming $1-{OS_NAME} to $1-$2-{OS_NAME}-{ARCHITECTURE}

mkdir -p release/bin/

# Rename executables.
mv release/bin/$1-linux    release/bin/$1-$2#linux-x64
mv release/bin/$1-macos    release/bin/$1-$2#darwin-x64
mv release/bin/$1-win.exe  release/bin/$1-$2#win32-x64.exe

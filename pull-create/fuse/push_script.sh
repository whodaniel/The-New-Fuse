#!/bin/bash
cd .
git init
git remote add origin https://github.com/whodaniel/fuse.git
git add .
git commit -m "Initial commit of The New Fuse project"
git push -u -f origin main

#!/bin/bash
php -q ./com.php
java -jar ./yuicompressor-2.4.2.jar --type js --charset utf-8 -o agnotes.js agnotes-debug.js

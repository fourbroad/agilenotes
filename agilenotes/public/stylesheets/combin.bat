for /f %%i in (dir.txt) do type %%i>>uicombin-debug.css
java -jar c:\yuicompressor-2.4.2.jar --type css --charset utf-8 -o uicombin.css uicombin-debug.css
pause
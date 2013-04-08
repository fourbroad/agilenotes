for /f %%i in (dir.txt) do type %%i>>agnotes-debug.js   
java -jar c:\yuicompressor-2.4.2.jar --type js --charset utf-8 -o agnotes.js agnotes-debug.js
pause
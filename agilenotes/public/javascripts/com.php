<?php
$filename = "dir.txt";
$fp = fopen($filename, "r");
if ($fp)
{
	$handel = fopen("agnotes-debug.js", "w+");
	$fname = "";
	while (!feof($fp))
	{		
		$fname = "./" . trim(fgets($fp));
		echo $fname;
		fwrite($handel, file_get_contents($fname));
	}
	fflush($handel);
	fclose($handel);
	fclose($fp);
}
// java -jar ./yuicompressor-2.4.2.jar --type js --charset utf-8 -o agnotes.js agnotes-debug.js

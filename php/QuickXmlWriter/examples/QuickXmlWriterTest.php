<?php
require_once('../QuickXmlWriter.php');

$writer = new QuickXmlWriter();
$writer->indentString = '   ';
$writer->omitXmlDeclaration = true;

$writer->
writeXmlLine('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">')->
open('html')->
	open('head')->
		openClose('title', 'Title')->
		openClose('link', array('href' => 'style.css', 'rel' => 'stylesheet', 'type' => 'text/css'))->
		openClose('meta', array('http-equiv' => 'Content-Type', 'content' => 'text/html; charset=iso-8859-1'))->
	close()->
	open('body')->
		openClose('h1', 'Title')->
		openClose('p', 'Hello World!', array('id' => 'helloworld'))->
		openClose('h2', 'Lists & stuff')->
		open('p')->
			openClose('img', array('alt' => 'This is an informative text in place of the image that isn\'t here.', 'src' => 'img.jpg'))->
		close()->
		open('ul')->
			open('li', 'List item #1')->
				open('ul')->
					openClose('li', 'Sublist item #1')->
					openClose('li', 'Sublist item #2')->
					openClose('li', 'Sublist item #3')->
			close(2)->
			open('li', 'List item #2')->
				open('ul')->
					openClose('li', 'Sublist item #1')->
					openClose('li', 'Sublist item #2')->
					openClose('li', 'Sublist item #3')->
			close(2)->
			open('li', 'List item #3')->
				open('ul')->
					openClose('li', 'Sublist item #1')->
					openClose('li', 'Sublist item #2')->
					openClose('li', 'Sublist item #3')->
		close(3)->
		openClose('h2', 'Source code')->
		open('div')->
			writeXml(highlight_file(__FILE__, true))->
closeAll();

echo $writer->getContents();
?>
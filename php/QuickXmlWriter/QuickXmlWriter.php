<?php
/**
 * Allows simple, programmatic creation of XML by allowing chaining of methods.
 *
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 *  
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */
class QuickXmlWriter {
	/**
	 * No indenting will be performed unless explicitly specified.
	 */
	const IndentManual = 0;
	/**
	 * Indenting will be performed automatically.
	 */
	const IndentAuto = 1;

	/**
	 * No newlines will be created unless explicitly specified.
	 */
	const NewlineManual = 0;
	/**
	 * Newlines will be created after each element.
	 */
	const NewlineAll = 1;
	/**
	 * Newlines will be created before elements, but not text.
	 */
	const NewlineSmart = 2;
	
	/**
	 * Regular expression for validating a node name.
	 */
	const RegexNodeName = '/^([a-z][a-z0-9]*:)?[a-z][a-z0-9-]*$/';

	/**
	 * The current indent mode of the writer.
	 *
	 * @var int
	 */
	public $indentMode = self::IndentAuto;
	/**
	 * The string that will be used for one indent.
	 *
	 * @var string
	 */
	public $indentString = "\t";
	/**
	 * The current newline mode of the writer.
	 *
	 * @var int
	 */
	public $newlineMode = self::NewlineSmart;
	/**
	 * The string that will be used for newlines.
	 *
	 * @var string
	 */
	public $newlineString = "\n";
	/**
	 * Whether to omit the XML declaration.
	 *
	 * @var bool
	 */
	public $omitXmlDeclaration = false;

	protected $buffer = '';
	protected $contentIsText = false;
	protected $indent = 0;
	protected $insideTag = false;
	protected $openTags = array();

	public function __toString() {
		return $this->getContents();
	}
	
	/**
	 * Closes the specified number of tags or one if no number is specified.
	 *
	 * @param int $numTags
	 * @return QuickXmlWriter This instance.
	 */
	public function close($numTags = 1) {
		for ($i = 0; $i < $numTags; $i++) {
			if (count($this->openTags) == 0) throw new QuickXmlWriterException('Cannot close tag; no tags are open.');

			if ($this->indentMode == self::IndentAuto) $this->indent--;

			if ($this->insideTag) {
				$this->insideTag = false;
				$this->write(' />', true);
				array_pop($this->openTags);
			} else {
				if ($this->newlineMode == self::NewlineAll || ($this->newlineMode == self::NewlineSmart && !$this->contentIsText)) {
					$this->writeLine();
				}

				$this->write('</' . array_pop($this->openTags) . '>', true);
			}
		}

		return $this;
	}

	/**
	 * Closes all currently open tags.
	 *
	 * @return QuickXmlWriter This instance.
	 */
	public function closeAll() {
		$this->close(count($this->openTags));
		return $this;
	}

	/**
	 * Opens a tag with the specified name, optionally with the specified attributes and/or text.
	 *
	 * @param string $tagName The name of the tag to open.
	 * @param array|string $arg1 The attributes of the tag if an array, or the text of the tag if a string.
	 * @param array|string $arg2 The attributes of the tag if an array, or the text of the tag if a string.
	 * @return QuickXmlWriter This instance.
	 */
	public function open($tagName, $arg1 = null, $arg2 = null) {
		$attributes = array();
		if (is_array($arg1)) $attributes = $arg1;
		if (is_array($arg2)) $attributes = $arg2;

		$content = '';
		if (is_string($arg1)) $content = $arg1;
		if (is_string($arg2)) $content = $arg2;

		if (!preg_match(self::RegexNodeName, $tagName)) throw new QuickXmlWriterException('Tag name not valid.');

		if (count($this->openTags) > 0) {
			if ($this->newlineMode == self::NewlineSmart) {
				$this->writeLine();
			} else if ($this->newlineMode == self::NewlineAll && !$this->insideTag) {
				$this->writeLine();
			}
		}

		$this->write('<' . $tagName, true);

		foreach ($attributes as $name => $value) {
			if (!preg_match(self::RegexNodeName, $name)) throw new QuickXmlWriterException('Attribute name not valid.');
			$this->buffer .= ' ' . $name . '="' . htmlentities($value) . '"';
		}

		$this->contentIsText = true;
		$this->insideTag = true;
		array_push($this->openTags, $tagName);

		if ($this->indentMode == self::IndentAuto) $this->indent++;

		if ($content) $this->write($content);

		return $this;
	}

	/**
	 * Opens and closes a tag with the specified name, optionally with the specified attributes and/or text.
	 *
	 * @param string $tagName The name of the tag to open and close.
	 * @param array|string $arg1 The attributes of the tag if an array, or the text of the tag if a string.
	 * @param array|string $arg2 The attributes of the tag if an array, or the text of the tag if a string.
	 * @return QuickXmlWriter This instance.
	 */
	public function openClose($tagName, $arg1 = null, $arg2 = null) {
		return $this->open($tagName, $arg1, $arg2)->close();
	}

	/**
	 * Writes the specified text to the buffer.
	 *
	 * @param string $string The text to write.
	 * @param bool $xml Whether the text is XML. If it's not XML, it will be escaped.
	 * @return QuickXmlWriter This instance.
	 */
	public function write($string, $xml = false) {
		if (!$this->buffer && !$this->omitXmlDeclaration) {
			$this->buffer .= '<?xml version="1.0" encoding="utf-8"?>' . $this->newlineString;
		}

		if ($this->insideTag) {
			$this->buffer .= '>';
			$this->insideTag = false;
			if ($this->newlineMode == self::NewlineAll) $this->writeLine();
		}

		if ($xml) {
			$this->contentIsText = false;
			$this->buffer .= $string;
		} else {
			$this->buffer .= htmlspecialchars($string);
		}

		return $this;
	}

	protected function writeIndent() {
		if ($this->indent > 0) $this->write(str_repeat($this->indentString, $this->indent), true);
	}

	/**
	 * Writes the specified text followed by a newline to the buffer.
	 *
	 * @param string $string The text to write.
	 * @param bool $xml Whether the text is XML. If it's not XML, it will be escaped.
	 * @return QuickXmlWriter This instance.
	 */
	public function writeLine($string = '', $xml = false) {
		$this->write($string . $this->newlineString, $xml);
		$this->writeIndent();

		return $this;
	}

	/**
	 * Writes the specified XML to the buffer.
	 *
	 * @param string $xml
	 * @return QuickXmlWriter This instance.
	 */
	public function writeXml($xml) {
		return $this->write($xml, true);
	}

	/**
	 * Writes the specified XML followed by a newline to the buffer.
	 *
	 * @param string $xml
	 * @return QuickXmlWriter This instance.
	 */
	public function writeXmlLine($xml = '') {
		return $this->writeLine($xml, true);
	}

	/**
	 * Empties the buffer.
	 */
	public function clearContents() {
		$this->buffer = '';
	}

	/**
	 * Retrieves the contents of the buffer.
	 *
	 * @return string
	 */
	public function getContents() {
		return $this->buffer;
	}

	/**
	 * Saves the buffer to a file.
	 *
	 * @param string $path The path of the file to save to.
	 */
	public function save($path) {
		$fp = @fopen($path, 'w');
		if (!$fp) throw new QuickXmlWriterException('Could not open file "' . $path . '" for writing.');
		fwrite($fp, $this->buffer);
		fclose($fp);
	}

	/**
	 * Increase the indent by the specified number of steps, or one if no number is specified.
	 *
	 * @param int $by The number of steps to increase by.
	 * @return QuickXmlWriter This instance.
	 */
	public function increaseIndent($by = 1) {
		$indent += (int)$by;
		return $this;
	}

	/**
	 * Decrease the indent by the specified number of steps, or one if no number is specified.
	 *
	 * @param int $by The number of steps to decrease by.
	 * @return QuickXmlWriter This instance.
	 */
	public function decreaseIndent($by = 1) {
		$indent -= (int)$by;
		if ($indent < 0) $indent = 0;
		return $this;
	}
}

class QuickXmlWriterException extends Exception {
	public function __construct($message) {
		$this->message = $message;
	}
}
?>

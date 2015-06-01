describe("scout.strings", function() {

  describe("nl2br", function() {

    it("can convert newlines to br tags", function() {
      expect(scout.strings.nl2br()).toBe(undefined);
      expect(scout.strings.nl2br('')).toBe('');
      expect(scout.strings.nl2br('Hello')).toBe('Hello');
      expect(scout.strings.nl2br('Hello\nGoodbye')).toBe('Hello<br>Goodbye');
      expect(scout.strings.nl2br('Hello\nGoodbye\n')).toBe('Hello<br>Goodbye<br>');
      expect(scout.strings.nl2br('Hello\n\nGoodbye')).toBe('Hello<br><br>Goodbye');
      expect(scout.strings.nl2br('Hello\n\r\nGoodbye')).toBe('Hello<br>\r<br>Goodbye');
    });

    it("encodes html, if the parameter is set to true (default)", function() {
      expect(scout.strings.nl2br('<b>Hello</b>\nGoodbye')).toBe('&lt;b&gt;Hello&lt;/b&gt;<br>Goodbye');
      expect(scout.strings.nl2br('Hello\n<br>\nGoodbye')).toBe('Hello<br>&lt;br&gt;<br>Goodbye');
    });

  });

  describe("removeAmpersand", function() {

    it("can remove ampersands", function() {
      expect(scout.strings.removeAmpersand()).toBe(undefined);
      expect(scout.strings.removeAmpersand('')).toBe('');
      expect(scout.strings.removeAmpersand(' ')).toBe(' ');
      expect(scout.strings.removeAmpersand('Hello')).toBe('Hello');
      expect(scout.strings.removeAmpersand('Hello & Co')).toBe('Hello  Co');
      expect(scout.strings.removeAmpersand('&Menu')).toBe('Menu');
      expect(scout.strings.removeAmpersand('&')).toBe('');
      expect(scout.strings.removeAmpersand('&One &Two &Three&')).toBe('One Two Three');
      expect(scout.strings.removeAmpersand('You&&Me')).toBe('You&Me');
      expect(scout.strings.removeAmpersand('You&&&Me')).toBe('You&Me');
      expect(scout.strings.removeAmpersand('You&&&&Me')).toBe('You&&Me');
      expect(scout.strings.removeAmpersand('You&&&&&Me')).toBe('You&&Me');
    });

  });

  describe("hasText", function() {

    it("can check if string has text", function() {
      expect(scout.strings.hasText()).toBe(false);
      expect(scout.strings.hasText('')).toBe(false);
      expect(scout.strings.hasText(' ')).toBe(false);
      expect(scout.strings.hasText('Hello')).toBe(true);
      expect(scout.strings.hasText('       .      ')).toBe(true);
      expect(scout.strings.hasText('       \n      ')).toBe(false);
      expect(scout.strings.hasText('       \n      \nn')).toBe(true);
    });

  });

  describe("repeat", function() {

    it("can repeat strings", function() {
      expect(scout.strings.repeat()).toBe(undefined);
      expect(scout.strings.repeat('')).toBe('');
      expect(scout.strings.repeat('X')).toBe('');
      expect(scout.strings.repeat('X', 1)).toBe('X');
      expect(scout.strings.repeat('X', 7)).toBe('XXXXXXX');
      expect(scout.strings.repeat('X', -7)).toBe('');
    });

  });

  describe("padZeroLeft", function() {

    it("can pad strings with 0", function() {
      expect(scout.strings.padZeroLeft()).toBe(undefined);
      expect(scout.strings.padZeroLeft('')).toBe('');
      expect(scout.strings.padZeroLeft('X')).toBe('X');
      expect(scout.strings.padZeroLeft('X', 1)).toBe('X');
      expect(scout.strings.padZeroLeft('X', 7)).toBe('000000X');
      expect(scout.strings.padZeroLeft('X', -7)).toBe('X');
    });

  });

  describe("startsWith", function() {

    it("can check if a string starts with another", function() {
      expect(scout.strings.startsWith('abc', 'a')).toBe(true);
      expect(scout.strings.startsWith('abc', 'b')).toBe(false);
      expect(scout.strings.startsWith('äabc', 'ä')).toBe(true);
      expect(scout.strings.startsWith('äabc', 'Ä')).toBe(false);
      expect(scout.strings.startsWith('abc', '')).toBe(true);
      expect(scout.strings.startsWith('', '')).toBe(true);
      expect(scout.strings.startsWith()).toBe(false);
      expect(scout.strings.startsWith(undefined, 'hello')).toBe(false);
      expect(scout.strings.startsWith('Der Himmel ist blau!', 'Der')).toBe(true);
      expect(scout.strings.startsWith('¿Vive usted en España?', 'Vive')).toBe(false);
      expect(scout.strings.startsWith('¿Vive usted en España?', '¿Vive')).toBe(true);
    });

  });

  describe("endsWith", function() {

    it("can check if a string ends with another", function() {
      expect(scout.strings.endsWith('abc', 'c')).toBe(true);
      expect(scout.strings.endsWith('abc', 'b')).toBe(false);
      expect(scout.strings.endsWith('abcä', 'ä')).toBe(true);
      expect(scout.strings.endsWith('abcä', 'Ä')).toBe(false);
      expect(scout.strings.endsWith('abc', '')).toBe(true);
      expect(scout.strings.endsWith('', '')).toBe(true);
      expect(scout.strings.endsWith()).toBe(false);
      expect(scout.strings.endsWith(undefined, 'hello')).toBe(false);
      expect(scout.strings.endsWith('Der Himmel ist blau!', 'blau')).toBe(false);
      expect(scout.strings.endsWith('Der Himmel ist blau!', 'blau!')).toBe(true);
    });

  });

  describe("count", function() {

    it("can count occurrences", function() {
      expect(scout.strings.count()).toBe(0);
      expect(scout.strings.count('hello')).toBe(0);
      expect(scout.strings.count('hello', 'xxx')).toBe(0);
      expect(scout.strings.count('hello', 'l')).toBe(2);
      expect(scout.strings.count('hello', 'll')).toBe(1);
      expect(scout.strings.count('hello', 'H')).toBe(0);
      expect(scout.strings.count('hello', 'h')).toBe(1);
      expect(scout.strings.count('hello! this a test. :-)', '  ')).toBe(0);
      expect(scout.strings.count('hello! this a test. :-)', ' ')).toBe(4);
      expect(scout.strings.count('{"validJson": true, "example": "ümlauts"}', 'ü')).toBe(1);
      expect(scout.strings.count('{"validJson": true, "example": "ümlauts"}', '"')).toBe(6);
      expect(scout.strings.count('the bird is the word', 'rd')).toBe(2);
    });

  });

  describe("encode", function() {

    it("encodes html", function() {
      expect(scout.strings.encode()).toBeUndefined();
      expect(scout.strings.encode('hello')).toBe('hello');
      expect(scout.strings.encode('<b>hello</b>')).toBe('&lt;b&gt;hello&lt;/b&gt;');
    });

  });

  describe("join", function() {

    it("joins strings", function() {
      expect(scout.strings.join()).toBe('');
      expect(scout.strings.join('')).toBe('');
      expect(scout.strings.join(' ')).toBe('');
      expect(scout.strings.join('hello')).toBe('');
      expect(scout.strings.join('hello', undefined)).toBe('');
      expect(scout.strings.join('hello', 'world')).toBe('world');
      expect(scout.strings.join('hello', 'world', '!')).toBe('worldhello!');
      expect(scout.strings.join(' ', 'hello', 'world', '!')).toBe('hello world !');
      expect(scout.strings.join(' ', 'hello', undefined, '!')).toBe('hello !');
      expect(scout.strings.join(' ', 'hello', null, '!')).toBe('hello !');
      expect(scout.strings.join(' ', 'hello', '', '!')).toBe('hello !');
      expect(scout.strings.join('  ', ' ', '', ' ')).toBe('    ');
      expect(scout.strings.join(undefined, 'one', 'two', 'three')).toBe('onetwothree');
      expect(scout.strings.join('', 'one', 'two', 'three')).toBe('onetwothree');
    });

  });

  describe("box", function() {

    it("boxes strings", function() {
      expect(scout.strings.box()).toBe('');
      expect(scout.strings.box('(')).toBe('');
      expect(scout.strings.box('(', undefined)).toBe('');
      expect(scout.strings.box('(', 'x')).toBe('(x');
      expect(scout.strings.box(undefined, 'x')).toBe('x');
      expect(scout.strings.box('(', 'x', ')')).toBe('(x)');
      expect(scout.strings.box('   (', 'x ', ')')).toBe('   (x )');
      expect(scout.strings.box(' (', 'x  ')).toBe(' (x  ');
      expect(scout.strings.box('(', 'x', ')', 'y')).toBe('(x)');
      expect(scout.strings.box('', 'x', '')).toBe('x');
      expect(scout.strings.box('a', ' ', 'b')).toBe('');
    });

  });

});

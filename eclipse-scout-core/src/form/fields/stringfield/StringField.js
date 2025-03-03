/*
 * Copyright (c) 2014-2018 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
import {
  arrays,
  BasicField,
  fields,
  InputFieldKeyStrokeContext,
  objects,
  scout,
  Status,
  StringFieldCtrlEnterKeyStroke,
  StringFieldEnterKeyStroke,
  StringFieldLayout,
  strings,
  texts
} from '../../../index';

export default class StringField extends BasicField {
  constructor() {
    super();

    this.format;
    this.hasAction = false;
    this.inputMasked = false;
    this.inputObfuscated = false;
    this.maxLength = 4000;
    this.multilineText = false;
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.selectionTrackingEnabled = false;
    this.spellCheckEnabled = false;
    this.trimText = true;
    this.wrapText = false;

    this._onSelectionChangingActionHandler = this._onSelectionChangingAction.bind(this);
  }

  static Format = {
    LOWER: 'a' /* IStringField.FORMAT_LOWER */,
    UPPER: 'A' /* IStringField.FORMAT_UPPER */
  };

  static TRIM_REGEXP = new RegExp('^(\\s*)(.*?)(\\s*)$');

  /**
   * Resolves the text key if value contains one.
   * This cannot be done in _init because the value field would call _setValue first
   */
  _initValue(value) {
    value = texts.resolveText(value, this.session.locale.languageTag);
    super._initValue(value);
  }

  /**
   * @override ModelAdapter.js
   */
  _initKeyStrokeContext() {
    super._initKeyStrokeContext();

    this.keyStrokeContext.registerKeyStroke([
      new StringFieldEnterKeyStroke(this),
      new StringFieldCtrlEnterKeyStroke(this)
    ]);
  }

  /**
   * @override Widget.js
   */
  _createKeyStrokeContext() {
    return new InputFieldKeyStrokeContext();
  }

  _render() {
    this.addContainer(this.$parent, 'string-field', new StringFieldLayout(this));
    this.addLabel();
    this.addMandatoryIndicator();

    var $field;
    if (this.multilineText) {
      $field = this._makeMultilineField();
      this.$container.addClass('multiline');
    } else {
      $field = fields.makeTextField(this.$parent);
    }
    $field.on('paste', this._onFieldPaste.bind(this));

    this.addField($field);
    this.addStatus();
  }

  _makeMultilineField() {
    var mouseDownHandler = function() {
      this.mouseClicked = true;
    }.bind(this);

    return this.$parent.makeElement('<textarea>')
      .on('DOMMouseScroll mousewheel', this._onMouseWheel.bind(this))
      .on('mousedown', mouseDownHandler)
      .on('focus', function(event) {
        this.$field.off('mousedown', mouseDownHandler);
        if (!this.mouseClicked) { // only trigger on tab focus in
          setTimeout(function() {
            if (!this.rendered || this.session.focusManager.isElementCovertByGlassPane(this.$field)) {
              return;
            }
            this._renderSelectionStart();
            this._renderSelectionEnd();
          }.bind(this));
        }
        this.mouseClicked = false;
      }.bind(this))
      .on('focusout', function() {
        this.$field.on('mousedown', mouseDownHandler);
      }.bind(this))
      .addDeviceClass();
  }

  _onFieldBlur() {
    super._onFieldBlur();
    if (this.multilineText) {
      this._updateSelection();
    }
    if (this.inputObfuscated) {
      // Restore obfuscated display text.
      this.$field.val(this.displayText);
    }
  }

  _onMouseWheel(event) {
    event = event.originalEvent || this.$container.window(true).event.originalEvent;
    // noinspection JSUnresolvedVariable
    var delta = event.wheelDelta ? -event.wheelDelta : event.detail;
    var scrollTop = this.$field[0].scrollTop;
    if (delta < 0 && scrollTop === 0) {
      // StringField is scrolled to the very top -> parent may scroll
      return;
    }
    var maxScrollTop = this.$field[0].scrollHeight - this.$field[0].clientHeight;
    if (delta > 0 && scrollTop >= maxScrollTop - 1) { // -1 because it can sometimes happen that scrollTop is maxScrollTop -1 or +1, just because clientHeight and scrollHeight are rounded values
      // StringField is scrolled to the very bottom -> parent may scroll
      this.$field[0].scrollTop = maxScrollTop; // Ensure it is really at the bottom (not -1px above)
      return;
    }
    // Don't allow others to scroll (e.g. Scrollbar) while scrolling in the text area
    event.stopPropagation();
  }

  _renderProperties() {
    super._renderProperties();

    this._renderInputMasked();
    this._renderWrapText();
    this._renderFormat();
    this._renderSpellCheckEnabled();
    this._renderHasAction();
    this._renderMaxLength();
    this._renderSelectionTrackingEnabled();
    // Do not render selectionStart and selectionEnd here, because that would cause the focus to
    // be set to <textarea>s in IE. Instead, the selection is rendered when the focus has entered
    // the field, see _render(). #168648
    this._renderDropType();
  }

  /**
   * Adds a click handler instead of a mouse down handler because it executes an action.
   * @override
   */
  addIcon() {
    this.$icon = fields.appendIcon(this.$container)
      .on('click', this._onIconClick.bind(this));
  }

  /**
   * override to ensure dropdown fields and touch mode smart fields does not have a clear icon.
   */
  isClearable() {
    return super.isClearable() && !this.multilineText;
  }

  setMaxLength(maxLength) {
    this.setProperty('maxLength', maxLength);
  }

  _renderMaxLength() {
    // Check if "maxLength" attribute is supported by browser
    if (this.$field[0].maxLength) {
      this.$field.attr('maxlength', this.maxLength);
    } else {
      // Fallback for IE9
      this.$field.on('keyup paste', function(e) {
        setTimeout(truncate.bind(this), 0);
      }.bind(this));
    }

    // Make sure current text does not exceed max length
    truncate.call(this);
    if (!this.rendering) {
      this.parseAndSetValue(this._readDisplayText());
    }

    function truncate() {
      var text = this.$field.val();
      if (text.length > this.maxLength) {
        this.$field.val(text.slice(0, this.maxLength));
      }
    }
  }

  setSelectionStart(selectionStart) {
    this.setProperty('selectionStart', selectionStart);
  }

  _renderSelectionStart() {
    if (scout.nvl(this.selectionStart, null) !== null) {
      this.$field[0].selectionStart = this.selectionStart;
    }
  }

  setSelectionEnd(selectionEnd) {
    this.setProperty('selectionEnd', selectionEnd);
  }

  _renderSelectionEnd() {
    if (scout.nvl(this.selectionEnd, null) !== null) {
      this.$field[0].selectionEnd = this.selectionEnd;
    }
  }

  setSelectionTrackingEnabled(selectionTrackingEnabled) {
    this.setProperty('selectionTrackingEnabled', selectionTrackingEnabled);
  }

  _renderSelectionTrackingEnabled() {
    this.$field
      .off('select', this._onSelectionChangingActionHandler)
      .off('mousedown', this._onSelectionChangingActionHandler)
      .off('keydown', this._onSelectionChangingActionHandler)
      .off('input', this._onSelectionChangingActionHandler);
    if (this.selectionTrackingEnabled) {
      this.$field.on('select', this._onSelectionChangingActionHandler)
        .on('mousedown', this._onSelectionChangingActionHandler)
        .on('keydown', this._onSelectionChangingActionHandler)
        .on('input', this._onSelectionChangingActionHandler);
    }
  }

  setInputMasked(inputMasked) {
    this.setProperty('inputMasked', inputMasked);
  }

  _renderInputMasked() {
    if (this.multilineText) {
      return;
    }
    this.$field.attr('type', this.inputMasked ? 'password' : 'text');
  }

  _renderInputObfuscated() {
    if (this.inputObfuscated && this.focused) {
      // If a new display text is set (e.g. because value in model changed) and field is focused,
      // do not display new display text but clear content (as in _onFieldFocus).
      // Depending on order of property render, either this or _renderDisplayText is called first
      // (inputObfuscated flag might be still in the old state in _renderDisplayText).
      this.$field.val('');
    }
  }

  setHasAction(hasAction) {
    this.setProperty('hasAction', hasAction);
  }

  _renderHasAction() {
    if (this.hasAction) {
      if (!this.$icon) {
        this.addIcon();
      }
      this.$container.addClass('has-icon');
    } else {
      this._removeIcon();
      this.$container.removeClass('has-icon');
    }
    this.revalidateLayout();
  }

  setFormatUpper(formatUpper) {
    if (formatUpper) {
      this.setFormat(StringField.Format.UPPER);
    } else {
      this.setFormat(null);
    }
  }

  setFormatLower(formatLower) {
    if (formatLower) {
      this.setFormat(StringField.Format.LOWER);
    } else {
      this.setFormat(null);
    }
  }

  setFormat(format) {
    this.setProperty('format', format);
  }

  _renderFormat() {
    if (this.format === StringField.Format.LOWER) {
      this.$field.css('text-transform', 'lowercase');
    } else if (this.format === StringField.Format.UPPER) {
      this.$field.css('text-transform', 'uppercase');
    } else {
      this.$field.css('text-transform', '');
    }
  }

  setSpellCheckEnabled(spellCheckEnabled) {
    this.setProperty('spellCheckEnabled', spellCheckEnabled);
  }

  _renderSpellCheckEnabled() {
    if (this.spellCheckEnabled) {
      this.$field.attr('spellcheck', 'true');
    } else {
      this.$field.attr('spellcheck', 'false');
    }
  }

  /**
   * @override
   */
  _renderDisplayText() {
    if (this.inputObfuscated && this.focused) {
      // If a new display text is set (e.g. because value in model changed) and field is focused,
      // do not display new display text but clear content (as in _onFieldFocus).
      // Depending on order of property render, either this or _renderInputObfuscated is called first
      // (inputObfuscated flag might be still in the old state in this method).
      this.$field.val('');
      return;
    }

    var displayText = strings.nvl(this.displayText);
    var oldDisplayText = strings.nvl(this.$field.val());
    var oldSelection = this._getSelection();
    super._renderDisplayText();
    // Try to keep the current selection for cases where the old and new display
    // text only differ because of the automatic trimming.
    if (this.trimText && oldDisplayText !== displayText) {
      var matches = oldDisplayText.match(StringField.TRIM_REGEXP);
      if (matches && matches[2] === displayText) {
        this._setSelection({
          start: Math.max(oldSelection.start - matches[1].length, 0),
          end: Math.min(oldSelection.end - matches[1].length, displayText.length)
        });
      }
    }
  }

  insertText(text) {
    if (!this.rendered) {
      this._postRenderActions.push(this.insertText.bind(this, text));
      return;
    }
    this._insertText(text);
  }

  _insertText(textToInsert) {
    if (!textToInsert) {
      return;
    }

    // Prevent insert if new length would exceed maxLength to prevent unintended deletion of characters at the end of the string
    var selection = this._getSelection();
    var text = this._applyTextToSelection(this.$field.val(), textToInsert, selection);
    if (text.length > this.maxLength) {
      this._showNotification('ui.CannotInsertTextTooLong');
      return;
    }

    this.$field.val(text);
    this._setSelection(selection.start + textToInsert.length);

    // Make sure display text gets sent (necessary if field does not have the focus)
    if (this.updateDisplayTextOnModify) {
      // If flag is true, we need to send two events (First while typing=true, second = false)
      this.acceptInput(true);
    }
    this.acceptInput();
  }

  _applyTextToSelection(text, textToInsert, selection) {
    if (this.inputObfuscated) {
      // Use empty text when input is obfuscated, otherwise text will be added to obfuscated text
      text = '';
    }
    return text.slice(0, selection.start) + textToInsert + text.slice(selection.end);
  }

  setWrapText(wrapText) {
    this.setProperty('wrapText', wrapText);
  }

  _renderWrapText() {
    this.$field.attr('wrap', this.wrapText ? 'soft' : 'off');
  }

  setTrimText(trimText) {
    this.setProperty('trimText', trimText);
  }

  _renderTrimText() {
    // nop, property used in _validateDisplayText()
  }

  _renderGridData() {
    super._renderGridData();
    this.updateInnerAlignment({
      useHorizontalAlignment: !this.multilineText
    });
  }

  _renderGridDataHints() {
    super._renderGridDataHints();
    this.updateInnerAlignment({
      useHorizontalAlignment: true
    });
  }

  _onIconClick(event) {
    this.acceptInput();
    this.$field.focus();
    this.trigger('action');
  }

  _onSelectionChangingAction(event) {
    if (event.type === 'mousedown') {
      this.$field.window().one('mouseup.stringfield', function() {
        // For some reason, when clicking side an existing selection (which clears the selection), the old
        // selection is still visible. To get around this case, we use setTimeout to handle the new selection
        // after it really has been changed.
        setTimeout(this._updateSelection.bind(this));
      }.bind(this));
    } else if (event.type === 'keydown') {
      // Use set timeout to let the cursor move to the target position
      setTimeout(this._updateSelection.bind(this));
    } else {
      this._updateSelection();
    }
  }

  _getSelection() {
    var start = scout.nvl(this.$field[0].selectionStart, null);
    var end = scout.nvl(this.$field[0].selectionEnd, null);
    if (start === null || end === null) {
      start = 0;
      end = 0;
    }
    return {
      start: start,
      end: end
    };
  }

  _setSelection(selectionStart, selectionEnd) {
    if (typeof selectionStart === 'number') {
      selectionEnd = scout.nvl(selectionEnd, selectionStart);
    } else if (typeof selectionStart === 'object') {
      selectionEnd = selectionStart.end;
      selectionStart = selectionStart.start;
    }
    this.$field[0].selectionStart = selectionStart;
    this.$field[0].selectionEnd = selectionEnd;
    this._updateSelection();
  }

  _updateSelection() {
    var oldSelectionStart = this.selectionStart;
    var oldSelectionEnd = this.selectionEnd;
    this.selectionStart = this.$field[0].selectionStart;
    this.selectionEnd = this.$field[0].selectionEnd;
    if (this.selectionTrackingEnabled) {
      var selectionChanged = this.selectionStart !== oldSelectionStart || this.selectionEnd !== oldSelectionEnd;
      if (selectionChanged) {
        this.triggerSelectionChange();
      }
    }
  }

  triggerSelectionChange() {
    this.trigger('selectionChange', {
      selectionStart: this.selectionStart,
      selectionEnd: this.selectionEnd
    });
  }

  _validateValue(value) {
    if (objects.isNullOrUndefined(value)) {
      return value;
    }
    value = strings.asString(value);
    if (this.trimText) {
      value = value.trim();
    }
    return super._validateValue(value);
  }

  /**
   * @override ValueField.js
   */
  _clear() {
    super._clear();

    // Disable obfuscation when user clicks on clear icon.
    this.inputObfuscated = false;
  }

  /**
   * @override ValueField.js
   */
  _updateEmpty() {
    this.empty = strings.empty(this.value);
  }

  /**
   * @override ValueField.js
   */
  acceptInput(whileTyping) {
    var displayText = scout.nvl(this._readDisplayText(), '');
    if (this.inputObfuscated && displayText !== '') {
      // Disable obfuscation if user has typed text (on focus, field will be cleared if obfuscated, so any typed text is new text).
      this.inputObfuscated = false;
    }

    super.acceptInput(whileTyping);
  }

  /**
   * @override BasicField.js
   */
  _onFieldFocus(event) {
    super._onFieldFocus(event);

    if (this.inputObfuscated) {
      this.$field.val('');

      // Without properly setting selection start and end, cursor is not visible in IE and Firefox.
      setTimeout(function() {
        if (!this.rendered) {
          return;
        }
        var $field = this.$field[0];
        $field.selectionStart = 0;
        $field.selectionEnd = 0;
      }.bind(this));
    }
  }

  /**
   * Get clipboard data, different strategies for browsers.
   * Must use a callback because this is required by Chrome's clipboard API.
   */
  _getClipboardData(event, doneHandler) {
    var data = event.originalEvent.clipboardData || this.$container.window(true).clipboardData;
    if (data) {
      // Chrome, Firefox
      if (data.items && data.items.length) {
        var item = arrays.find(data.items, function(item) {
          return item.type === 'text/plain';
        });
        if (item) {
          item.getAsString(doneHandler);
        }
        return;
      }

      // IE, Safari
      if (data.getData) {
        doneHandler(data.getData('Text'));
      }
    }

    // Can't access clipboard -> don't call done handler
  }

  _onFieldPaste(event) {
    // must store text and selection because when the callback is executed, the clipboard content has already been applied to the input field
    var text = this.$field.val();
    var selection = this._getSelection();

    this._getClipboardData(event, function(pastedText) {
      if (!pastedText) {
        return;
      }

      // Make sure the user is notified about pasted text which is cut off because of maxlength constraints
      text = this._applyTextToSelection(text, pastedText, selection);
      if (text.length > this.maxLength) {
        this._showNotification('ui.PastedTextTooLong');
      }
    }.bind(this));
  }

  _showNotification(textKey) {
    scout.create('DesktopNotification', {
      parent: this,
      severity: Status.Severity.WARNING,
      message: this.session.text(textKey)
    }).show();
  }

  /**
   * @override BasicField.js
   */
  _checkDisplayTextChanged(displayText, whileTyping) {
    var displayTextChanged = super._checkDisplayTextChanged(displayText, whileTyping);

    // Display text hasn't changed if input is obfuscated and current display text is empty (because field will be cleared if user focuses obfuscated text field).
    if (displayTextChanged && this.inputObfuscated && displayText === '') {
      return false;
    }

    return displayTextChanged;
  }
}

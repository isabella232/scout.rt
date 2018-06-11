/*******************************************************************************
 * Copyright (c) 2014-2017 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
scout.ProposalField2 = function() {
  scout.ProposalField2.parent.call(this);

  this.maxLength = 4000;
  this.trimText = true;

  /**
   * If this flag is set to true the proposal field performs a lookup by text when
   * accept proposal is called. The behavior is similar to what the smart-field does
   * in that case, but without the need to have a valid single match as the result
   * from the lookup.
   */
  this.lookupOnAcceptByText = false;
};
scout.inherits(scout.ProposalField2, scout.SmartField2);

scout.ProposalField2.prototype._getValueFromLookupRow = function(lookupRow) {
  return lookupRow.text;
};

scout.ProposalField2.prototype.cssClassName = function() {
  return 'proposal-field';
};

scout.ProposalField2.prototype._handleEnterKey = function(event) {
  this.acceptInput();
  if (this.popup) {
    this.closePopup();
    event.stopPropagation();
  }
};

scout.ProposalField2.prototype._lookupByTextOrAllDone = function(result) {
  if (result.lookupRows.length === 0) {
    this.setLoading(false);
    this._handleEmptyResult();
    return;
  }
  scout.ProposalField2.parent.prototype._lookupByTextOrAllDone.call(this, result);
};

scout.ProposalField2.prototype._formatValue = function(value) {
  return scout.nvl(value, '');
};

scout.ProposalField2.prototype._validateValue = function(value) {
  if (scout.objects.isNullOrUndefined(value)) {
    return value;
  }
  var validValue = scout.strings.asString(value);
  if (this.trimText) {
    validValue = validValue.trim();
  }
  if (validValue.length > this.maxLength) {
    validValue = validValue.substring(0, this.maxLength);
  }
  return validValue;
};

scout.ProposalField2.prototype._ensureValue = function(value) {
  return scout.strings.asString(value);
};

/**
 * When 'clear' has been clicked (searchText is empty), we want to call customTextAccepted,
 * so the new value is sent to the server #221199.
 */
scout.ProposalField2.prototype._acceptByText = function(searchText) {
  $.log.debug('(ProposalField2#_acceptByText) searchText=', searchText);
  if (this.lookupOnAcceptByText && scout.strings.hasText(searchText)) {
    scout.ProposalField2.parent.prototype._acceptByText.call(this, searchText);
  } else {
    this._customTextAccepted(searchText);
  }
};

/**
 * Only used in case lookupOnAcceptByText is true. It's basically the same code
 * as in the smart-field but without the error handling.
 */
scout.ProposalField2.prototype._acceptByTextDone = function(result) {
  this._userWasTyping = false;
  this._extendResult(result);

  // when there's exactly one result, we accept that lookup row
  if (result.numLookupRows === 1) {
    var lookupRow = result.singleMatch;
    if (this._isLookupRowActive(lookupRow)) {
      this.setLookupRow(lookupRow);
      this._inputAccepted();
      return;
    }
  }

  this._customTextAccepted(result.searchText);
};

scout.ProposalField2.prototype._checkSearchTextChanged = function(searchText) {
  return this._checkDisplayTextChanged(searchText);
};

scout.ProposalField2.prototype._customTextAccepted = function(searchText) {
  this._setLookupRow(null); // only reset property lookup
  this._setValue(searchText);
  this._inputAccepted(true, false);
};

scout.ProposalField2.prototype.getValueForSelection = function() {
  if (!this._showSelection()) {
    return null;
  }
  return this.lookupRow.key;
};

/**
 * This function is overridden by ProposalField because it has a different behavior than the smart-field.
 */
scout.ProposalField2.prototype._acceptLookupRowAndValueFromField = function(otherField) {
  if (this.lookupRow !== otherField.lookupRow) {
    this.setLookupRow(otherField.lookupRow);
  }
};

/**
 * In ProposalField value and display-text is the same. When a custom text has been entered,
 * the value is set and the lookup-row is null.
 */
scout.ProposalField2.prototype._copyValuesFromField = function(otherField) {
  if (this.lookupRow !== otherField.lookupRow) {
    this.setLookupRow(otherField.lookupRow);
  }
  if (this.value !== otherField.value) {
    this.setValue(otherField.value);
  }
};

scout.ProposalField2.prototype._acceptInput = function(searchText, searchTextEmpty, searchTextChanged, selectedLookupRow) {
  // Do nothing when search text is equals to the text of the current lookup row
  if (!selectedLookupRow && this.lookupRow && this.lookupRow.text === searchText) {
    $.log.debug('(SmartField2#acceptInput) unchanged: text is equals. Close popup');
    this._inputAccepted(false);
    return;
  }

  // 2.) proposal chooser is open -> use the selected row as value
  if (selectedLookupRow) {
    $.log.debug('(SmartField2#acceptInput) lookup-row selected. Set lookup-row, close popup lookupRow=', selectedLookupRow.toString());
    this.clearErrorStatus();
    this.setLookupRow(selectedLookupRow);
    this._inputAccepted();
    return;
  }

  // 3.) proposal chooser is not open -> try to accept the current display text
  // this causes a lookup which may fail and open a new proposal chooser (property
  // change for 'result').
  if (searchTextChanged) {
    this._acceptByText(searchText);
  } else if (!this._hasUiError()) {
    this._inputAccepted(false);
  } else {
    // even though there's nothing todo, someone could wait for our promise to be resolved
    this._acceptInputDeferred.resolve();
  }

  return this._acceptInputDeferred.promise();
};

scout.ProposalField2.prototype.setTrimText = function(trimText) {
  this.setProperty('trimText', trimText);
};

scout.ProposalField2.prototype.setMaxLength = function(maxLength) {
  this.setProperty('maxLength', maxLength);
};
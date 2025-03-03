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
import {CellEditorCancelEditKeyStroke, CellEditorCompleteEditKeyStroke, CellEditorPopupLayout, CellEditorTabKeyStroke, FormField, graphics, keys, Point, Popup, scout} from '../../index';
import $ from 'jquery';

export default class CellEditorPopup extends Popup {

  constructor() {
    super();
    this.table = null;
    this.column = null;
    this.row = null;
    this.cell = null;
    this._pendingCompleteCellEdit = null;
    this._keyStrokeHandler = this._onKeyStroke.bind(this);
  }

  _init(options) {
    options.scrollType = options.scrollType || 'position';
    super._init(options);

    this.table = options.column.table;
    this.link(this.cell.field);
  }

  _createLayout() {
    return new CellEditorPopupLayout(this);
  }

  /**
   * @override
   */
  _initKeyStrokeContext() {
    super._initKeyStrokeContext();

    this.keyStrokeContext.registerKeyStroke([
      new CellEditorCompleteEditKeyStroke(this),
      new CellEditorTabKeyStroke(this)
    ]);

    // Don't propagate up/down key strokes to the table, because the table
    // would call event.preventDefault() in its own "stop propagation
    // interceptor" and the cursor would not move in multi line string fields.
    this.keyStrokeContext.registerStopPropagationInterceptor(function(event) {
      if (scout.isOneOf(event.which, keys.UP, keys.DOWN)) {
        event.stopPropagation();
      }
    });
  }

  /**
   * @override Popup.js
   */
  _createCloseKeyStroke() {
    return new CellEditorCancelEditKeyStroke(this);
  }

  /**
   * @override
   */
  _open($parent, event) {
    this.render($parent, event);
    this.position();
    this.pack();
  }

  _render() {
    super._render();

    // determine CSS class for first and last column, required for additional margins/padding in cell-editor
    var cssClass = '',
      visibleCols = this.table.visibleColumns(),
      colPos = visibleCols.indexOf(this.column);
    if (colPos === 0) { // first cell
      cssClass = 'first';
    } else if (colPos === visibleCols.length - 1) { // last cell
      cssClass = 'last';
    }

    this.$container
      .addClass('cell-editor-popup ' + cssClass)
      .data('popup', this);

    var field = this.cell.field;
    field.mode = FormField.Mode.CELLEDITOR; // hint that this field is used within a cell-editor
    field.render();
    field.prepareForCellEdit({
      cssClass: cssClass
    });

    // Make sure cell content is not visible while the editor is open (especially necessary for transparent editors like checkboxes)
    this.$anchor.css('visibility', 'hidden');

    this._rowOrderChangedFunc = function(event) {
      if (event.animating) {
        // row is only set while animating
        if (event.row === this.row) {
          this.position();
        }
      } else {
        this.position();
      }
    }.bind(this);
    this.table.on('rowOrderChanged', this._rowOrderChangedFunc);
    // Set table style to focused, so that it looks as it still has the focus.
    // This prevents flickering if the cell editor gets opened, especially when tabbing to the next cell editor.
    if (this.table.enabled) {
      this.table.$container.addClass('focused');
    }
    this.session.keyStrokeManager.on('keyStroke', this._keyStrokeHandler);
  }

  _postRender() {
    super._postRender(); // installs the focus context for this popup

    // If applicable, invoke the field's function 'onCellEditorRendered' to signal the cell-editor to be rendered.
    var field = this.cell.field;
    if (field.onCellEditorRendered) {
      field.onCellEditorRendered({
        openFieldPopup: this.table.openFieldPopupOnCellEdit,
        cellEditorPopup: this
      });
    }
  }

  _remove() {
    super._remove(); // uninstalls the focus context for this popup

    this.session.keyStrokeManager.off('keyStroke', this._keyStrokeHandler);
    this.table.off('rowOrderChanged', this._rowOrderChangedFunc);
    // table may have been removed in the meantime
    if (this.table.rendered) {
      this.table.$container.removeClass('focused');
    }
    this.$anchor.css('visibility', '');
  }

  position() {
    var cellBounds, rowBounds,
      $tableData = this.table.$data,
      $row = this.row.$row,
      $cell = this.$anchor,
      insetsLeft = $tableData.cssPxValue('padding-left') + $row.cssBorderLeftWidth();

    cellBounds = graphics.bounds($cell);
    cellBounds.x += $cell.cssMarginX(); // first cell popup has a negative left margin
    rowBounds = graphics.bounds($row);
    rowBounds.y += $row.cssMarginY(); // row has a negative top margin
    this.setLocation(new Point(insetsLeft + cellBounds.x, $tableData.scrollTop() + rowBounds.y));
  }

  /**
   * @returns {Promise} resolved when acceptInput is performed on the editor field
   */
  completeEdit(waitForAcceptInput) {
    if (this._pendingCompleteCellEdit) {
      // Make sure complete cell edit does not get sent twice since it will lead to exceptions. This may happen if user clicks very fast multiple times.
      return this._pendingCompleteCellEdit;
    }

    // There is no blur event when the popup gets closed -> trigger blur so that the field may react (accept display text, close popups etc.)
    // When acceptInput returns a promise, we must wait until input is accepted
    // Otherwise call completeEdit immediately, also call it immediately if waitForAcceptInput is false (see _onKeyStroke)
    var field = this.cell.field;
    var acceptInputPromise = field.acceptInput();
    if (!acceptInputPromise || !scout.nvl(waitForAcceptInput, true)) {
      this._pendingCompleteCellEdit = $.resolvedPromise();
      this.table.completeCellEdit();
    } else {
      this._pendingCompleteCellEdit = acceptInputPromise.then(function() {
        this.table.completeCellEdit();
      }.bind(this));
    }

    this._pendingCompleteCellEdit.then(function() {
      this._pendingCompleteCellEdit = null;
    }.bind(this));

    return this._pendingCompleteCellEdit;
  }

  isCompleteCellEditRequested() {
    return !!this._pendingCompleteCellEdit;
  }

  cancelEdit() {
    this.table.cancelCellEdit();
    this.remove();
  }

  _onMouseDownOutside(event) {
    this.completeEdit();
  }

  _onKeyStroke(event) {
    if (!this.session.keyStrokeManager.invokeAcceptInputOnActiveValueField(event.keyStroke, event.keyStrokeContext)) {
      return;
    }
    if (this.$container.isOrHas(event.keyStrokeContext.$getScopeTarget())) {
      // Don't interfere with key strokes of the popup or children of the popup (otherwise pressing enter would close both the popup and the form at once)
      return;
    }
    // Make sure completeEdit is called immediately after calling acceptInput.
    // Otherwise the key stroke will be executed before completing the edit which prevents the input from being saved
    this.completeEdit(false);
  }

  waitForCompleteCellEdit() {
    if (this._pendingCompleteCellEdit) {
      return this._pendingCompleteCellEdit.promise();
    }
    return $.resolvedPromise();
  }
}

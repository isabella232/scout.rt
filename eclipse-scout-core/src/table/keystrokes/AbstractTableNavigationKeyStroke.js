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
import {arrays, graphics, KeyStroke} from '../../index';

export default class AbstractTableNavigationKeyStroke extends KeyStroke {

  constructor(table) {
    super();
    this.repeatable = true;
    this.field = table;
    this.shift = !table.multiSelect ? false : undefined;
    this.stopPropagation = true;
    this.keyStrokeMode = KeyStroke.Mode.DOWN;
  }

  _accept(event) {
    var accepted = super._accept(event);
    if (!accepted) {
      return false;
    }

    if (!this.field.visibleRows.length) {
      return false;
    }

    var activeElement = this.field.$container.activeElement(true),
      elementType = activeElement.tagName.toLowerCase();
    if (activeElement.className !== 'table-text-filter' &&
      (elementType === 'textarea' || elementType === 'input') &&
      (!event.originalEvent || (event.originalEvent && !event.originalEvent.smartFieldEvent))) {
      return false;
    }

    return true;
  }

  /**
   * Returns viewport sensitive information containing the first and last visible row in the viewport.
   */
  _viewportInfo() {
    var viewportBounds, dataInsets, dataMarginTop, firstRow, lastRow,
      table = this.field,
      viewport = {},
      rows = table.visibleRows;

    if (rows.length === 0) {
      return viewport;
    }

    viewportBounds = graphics.offsetBounds(table.$data);
    dataInsets = graphics.insets(table.$data);
    dataMarginTop = table.$data.cssMarginTop();
    viewportBounds = viewportBounds.subtract(dataInsets);

    // if data has a negative margin, adjust viewport otherwise a selected first row will never be in the viewport
    if (dataMarginTop < 0) {
      viewportBounds.y -= Math.abs(dataMarginTop);
      viewportBounds.height += Math.abs(dataMarginTop);
    }

    firstRow = this._findFirstRowInViewport(table, viewportBounds);
    lastRow = this._findLastRowInViewport(table, rows.indexOf(firstRow), viewportBounds);

    viewport.firstRow = firstRow;
    viewport.lastRow = lastRow;
    return viewport;
  }

  firstRowAfterSelection() {
    var $selectedRows = this.field.$selectedRows();
    if (!$selectedRows.length) {
      return;
    }

    var rows = this.field.visibleRows,
      row = $selectedRows.last().data('row'),
      rowIndex = this.field.filteredRows().indexOf(row);

    return rows[rowIndex + 1];
  }

  firstRowBeforeSelection() {
    var $selectedRows = this.field.$selectedRows();
    if (!$selectedRows.length) {
      return;
    }
    var rows = this.field.visibleRows,
      row = $selectedRows.first().data('row'),
      rowIndex = this.field.visibleRows.indexOf(row);

    return rows[rowIndex - 1];
  }

  /**
   * Searches for the last selected row in the current selection block, starting from rowIndex. Expects row at rowIndex to be selected.
   */
  _findLastSelectedRowBefore(table, rowIndex) {
    var row, rows = table.visibleRows;
    if (rowIndex === 0) {
      return rows[rowIndex];
    }
    row = arrays.findFromReverse(rows, rowIndex, function(row, i) {
      var previousRow = rows[i - 1];
      if (!previousRow) {
        return false;
      }
      return !table.isRowSelected(previousRow);
    });
    // when no row has been found, use first row in table
    if (!row) {
      row = rows[0];
    }
    return row;
  }

  /**
   * Searches for the last selected row in the current selection block, starting from rowIndex. Expects row at rowIndex to be selected.
   */
  _findLastSelectedRowAfter(table, rowIndex) {
    var row, rows = table.visibleRows;
    if (rowIndex === rows.length - 1) {
      return rows[rowIndex];
    }
    row = arrays.findFrom(rows, rowIndex, function(row, i) {
      var nextRow = rows[i + 1];
      if (!nextRow) {
        return false;
      }
      return !table.isRowSelected(nextRow);
    });
    // when no row has been found, use last row in table
    if (!row) {
      row = rows[rows.length - 1];
    }
    return row;
  }

  _findFirstRowInViewport(table, viewportBounds) {
    var rows = table.visibleRows;
    return arrays.find(rows, function(row, i) {
      var rowOffset, rowMarginTop,
        $row = row.$row;

      if (!row.$row) {
        // If row is not rendered, it cannot be part of the view port -> check next row
        return false;
      }
      rowOffset = $row.offset();
      rowMarginTop = row.$row.cssMarginTop();
      // Selected row has a negative row margin
      // -> add this margin to the offset to make sure this function does always return the same row independent of selection state
      if (rowMarginTop < 0) {
        rowOffset.top += Math.abs(rowMarginTop);
      }

      // If the row is fully visible in the viewport -> break and return the row
      return viewportBounds.contains(rowOffset.left, rowOffset.top);
    });
  }

  _findLastRowInViewport(table, startRowIndex, viewportBounds) {
    var rows = table.visibleRows;
    if (startRowIndex === rows.length - 1) {
      return rows[startRowIndex];
    }
    return arrays.findFromForward(rows, startRowIndex, function(row, i) {
      var nextRowOffsetBounds, $nextRow,
        nextRow = rows[i + 1];

      if (!nextRow) {
        // If next row is not available (row is the last row) -> break and return current row
        return true;
      }
      $nextRow = nextRow.$row;
      if (!$nextRow) {
        // If next row is not rendered anymore, current row has to be the last in the viewport
        return true;
      }
      nextRowOffsetBounds = graphics.offsetBounds($nextRow);
      // If the next row is not fully visible in the viewport -> break and return current row
      return !viewportBounds.contains(nextRowOffsetBounds.x, nextRowOffsetBounds.y + nextRowOffsetBounds.height - 1);
    });
  }

  _isEnabled() {
    return !this.field.tileMode;
  }
}

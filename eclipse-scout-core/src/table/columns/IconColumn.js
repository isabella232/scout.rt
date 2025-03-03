/*
 * Copyright (c) 2014-2017 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
import {Column} from '../../index';

export default class IconColumn extends Column {

  constructor() {
    super();
    this.minWidth = Column.NARROW_MIN_WIDTH;
    this.filterType = 'ColumnUserFilter';
    this.textBased = false;
  }

  /**
   * @override
   */
  _initCell(cell) {
    super._initCell(cell);
    // only display icon, no text
    cell.text = null;
    cell.iconId = cell.value || cell.iconId;
    return cell;
  }

  /**
   * @override
   */
  _formatValue(value) {
    // only display icon, no text
    return null;
  }

  /**
   * @override
   */
  _cellCssClass(cell, tableNode) {
    var cssClass = super._cellCssClass(cell, tableNode);
    cssClass += ' table-icon-cell';
    return cssClass;
  }

  /**
   * @override
   */
  cellTextForGrouping(row) {
    var cell = this.table.cell(this, row);
    return cell.value;
  }

  createAggrGroupCell(row) {
    var cell = super.createAggrGroupCell(row);
    // Make sure only icon and no text is displayed
    cell.text = null;
    return cell;
  }
}

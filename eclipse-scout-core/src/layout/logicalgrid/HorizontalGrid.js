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
import {AbstractGrid, HorizontalGridMatrix} from '../../index';

export default class HorizontalGrid extends AbstractGrid {

  constructor(options) {
    super(options);
  }

  layoutAllDynamic(widgets) {
    var matrix = new HorizontalGridMatrix(this.getGridColumnCount());
    matrix.computeGridData(widgets);
    this.gridRows = matrix.getRowCount();
  }
}

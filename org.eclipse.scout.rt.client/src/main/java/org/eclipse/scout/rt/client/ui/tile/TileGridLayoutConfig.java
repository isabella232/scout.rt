/*
 * Copyright (c) 2010-2018 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.rt.client.ui.tile;

import org.eclipse.scout.rt.client.ui.form.fields.LogicalGridLayoutConfig;

public class TileGridLayoutConfig extends LogicalGridLayoutConfig {
  private int m_maxWidth = -1;

  public TileGridLayoutConfig() {
    // when changing these default values remember to also change the
    // defaults in the java-script: 'tile-grid-layout-config' in TileGrid.less
    setColumnWidth(200);
    setRowHeight(150);
    setHGap(30);
    setVGap(30);
  }

  public TileGridLayoutConfig(TileGridLayoutConfig config) {
    super(config);
    setMaxWidth(config.getMaxWidth());
  }

  /**
   * @return the maximum width in pixels to use for the content. The maximum is disabled if this value is
   *         <code>&lt;= 0</code>.
   */
  public int getMaxWidth() {
    return m_maxWidth;
  }

  /**
   * @param maxWidth
   *          the maximum width in pixels to use for the content. The maximum is disabled if this value is
   *          <code>&lt;= 0</code>
   */
  public void setMaxWidth(int maxWidth) {
    m_maxWidth = maxWidth;
  }

  /**
   * @see #setMaxWidth(int)
   */
  public TileGridLayoutConfig withMaxWidth(int maxWidth) {
    setMaxWidth(maxWidth);
    return this;
  }

  public TileGridLayoutConfig usePreferredWidth(int gridColumnCount) {
    setMaxWidth(calculatePreferredWidth(gridColumnCount));
    return this;
  }

  /**
   * @see #setColumnWidth(int)
   */
  @Override
  public TileGridLayoutConfig withColumnWidth(int columnWidth) {
    setColumnWidth(columnWidth);
    return this;
  }

  /**
   * @see #setRowHeight(int)
   */
  @Override
  public TileGridLayoutConfig withRowHeight(int rowHeight) {
    setRowHeight(rowHeight);
    return this;
  }

  /**
   * @see #setHGap(int)
   */
  @Override
  public TileGridLayoutConfig withHGap(int hgap) {
    setHGap(hgap);
    return this;
  }

  /**
   * @see #setVGap(int)
   */
  @Override
  public TileGridLayoutConfig withVGap(int vgap) {
    setVGap(vgap);
    return this;
  }

  /**
   * @see #setMinWidth(int)
   */
  @Override
  public TileGridLayoutConfig withMinWidth(int minWidth) {
    setMinWidth(minWidth);
    return this;
  }

  /**
   * @returns the preferred width based on grid column count, column width and horizontal gap.
   */
  public int calculatePreferredWidth(int gridColumnCount) {
    return gridColumnCount * getColumnWidth() + (gridColumnCount - 1) * getHGap();
  }

  @Override
  public TileGridLayoutConfig copy() {
    return new TileGridLayoutConfig(this);
  }
}

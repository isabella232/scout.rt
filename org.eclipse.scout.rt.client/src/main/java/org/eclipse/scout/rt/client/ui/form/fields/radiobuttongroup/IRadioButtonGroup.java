/*******************************************************************************
 * Copyright (c) 2010-2015 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.rt.client.ui.form.fields.radiobuttongroup;

import java.util.List;

import org.eclipse.scout.rt.client.ui.form.fields.ICompositeField;
import org.eclipse.scout.rt.client.ui.form.fields.IValueField;
import org.eclipse.scout.rt.client.ui.form.fields.button.IRadioButton;

public interface IRadioButtonGroup<T> extends IValueField<T>, ICompositeField {

  /**
   * int property that stores the number of columns of the group.
   *
   * @see #DEFAULT_GRID_COLUMN_COUNT
   */
  String PROP_GRID_COLUMN_COUNT = "gridColumnCount";

  /**
   * Use columns as required to display all radio buttons in the height of this group.<br>
   * Can be used in {@link #setGridColumnCount(int)}.<br>
   * Instructs the radio button group to calculate the number of columns based on the number of radio buttons and the
   * configured height of the field.
   */
  int DEFAULT_GRID_COLUMN_COUNT = -1;

  /**
   * @return the buttons controlled by this radio button group
   */
  List<IRadioButton<T>> getButtons();

  /**
   * @return the button representing this value
   */
  IRadioButton<T> getButtonFor(T radioValue);

  /**
   * @return the selected radio button controlled by this radio button group
   */
  IRadioButton<T> getSelectedButton();

  /**
   * select a button controlled by this radio button group
   */
  void selectButton(IRadioButton<T> button);

  /**
   * @return the radio value of the selected button controlled by this radio button group
   */
  T getSelectedKey();

  /**
   * select the buttons controlled by this radio button group with this radio value
   */
  void selectKey(T key);

  /**
   * Gets the number of columns this group uses to layout radio buttons.
   */
  int getGridColumnCount();

  /**
   * Sets a new grid column count which is used to layout radio buttons.
   *
   * @param c
   *          the new number of columns. If a value < 0 is passed (e.g. {@link #DEFAULT_GRID_COLUMN_COUNT}), the number
   *          of columns is reset to the default which means it uses the required number of columns to show all radio
   *          buttons within the height of this group.
   * @return {@code true} if the column count has been changed. This also triggers a rebuild of the grid for the current
   *         group. {@code false} if it was already set to this value and nothing was updated.
   */
  boolean setGridColumnCount(int c);
}

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
package org.eclipse.scout.rt.client.ui.action;

import java.security.Permission;

import org.eclipse.scout.rt.client.ui.IStyleable;
import org.eclipse.scout.rt.client.ui.IWidget;
import org.eclipse.scout.rt.client.ui.basic.table.ITable;
import org.eclipse.scout.rt.platform.IOrdered;
import org.eclipse.scout.rt.shared.dimension.IVisibleDimension;

/**
 * Actions have a trigger scope that is a combination of the "locations" {@link #isSingleSelectionAction()},
 * {@link #isMultiSelectionAction()}, {@link #isNonSelectionAction()}, {@link #isEmptySpaceAction()} and the granting
 * {@link #isEnabledIncludingParents()}, {@link #isInheritAccessibility()}.
 * <p>
 * Examples:<br>
 * A typical NEW menu on a table that is only visible on the empty space of the table and only when the table field is
 * enabled would have emptySpaceAction=false;
 */
public interface IAction extends IWidget, IOrdered, IStyleable, IVisibleDimension {

  String PROP_CONTAINER = "container";
  String PROP_ICON_ID = "iconId";
  String PROP_TEXT = "text";
  String PROP_TOOLTIP_TEXT = "tooltipText";
  String PROP_SELECTED = "selected";
  String PROP_VISIBLE = "visible";
  String PROP_KEY_STROKE = "keyStroke";
  String PROP_KEYSTROKE_FIRE_POLICY = "keyStrokeFirePolicy";
  String PROP_ORDER = "order";
  String PROP_HORIZONTAL_ALIGNMENT = "horizontalAlignment";
  String PROP_ACTION_STYLE = "actionStyle";

  byte HORIZONTAL_ALIGNMENT_LEFT = -1;
  byte HORIZONTAL_ALIGNMENT_RIGHT = 1;

  int ACTION_STYLE_DEFAULT = 0;
  int ACTION_STYLE_BUTTON = 1;

  /**
   * Fire keystroke only when the action is accessible (e.g. not covered by a modal dialog)<br>
   * see {@link #setKeyStrokeFirePolicy(keyStrokeFirePolicy)} and {@link #getKeyStrokeFirePolicy()}
   */
  int KEYSTROKE_FIRE_POLICY_ACCESSIBLE_ONLY = 0;

  /**
   * Always fire keystroke (even when the action itself is covered by a modal dialog)<br>
   * see {@link #setKeyStrokeFirePolicy(keyStrokeFirePolicy)} and {@link #getKeyStrokeFirePolicy()}
   */
  int KEYSTROKE_FIRE_POLICY_ALWAYS = 1;

  /**
   * called to perform action
   */
  void doAction();

  /**
   * With this method it's possible to set (custom) properties.
   * <p>
   * <b>Important: </b> Although this method is intended to be used for custom properties, it's actually possible to
   * change main properties as well. Keep in mind that directly changing main properties may result in unexpected
   * behavior, so do it only if you really know what you are doing. Rather use the officially provided api instead. <br>
   * Example for an unexpected behavior: setVisible() does not only set the property PROP_VISIBLE but also executes
   * additional code. This code would NOT be executed by directly setting the property PROP_VISIBLE with setProperty().
   */
  @Override
  void setProperty(String name, Object value);

  String getActionId();

  String getIconId();

  void setIconId(String iconId);

  String getText();

  void setText(String text);

  int getActionStyle();

  void setActionStyle(int style);

  /**
   * Key stroke with format lowercase [shift-] [control-] [alternate-] key
   * <p>
   * Examples:
   * <ul>
   * <li>"*"
   * <li>"space"
   * <li>"control-s"
   * <li>"shift-control-t"
   * </ul>
   */
  String getKeyStroke();

  void setKeyStroke(String keyStroke);

  int getKeyStrokeFirePolicy();

  void setKeyStrokeFirePolicy(int keyStrokeFirePolicy);

  String getTooltipText();

  void setTooltipText(String text);

  boolean isSeparator();

  void setSeparator(boolean separator);

  boolean isSelected();

  void setSelected(boolean selected);

  boolean isVisible();

  void setVisible(boolean visible);

  /**
   * Access control<br>
   * when false, visible property cannot be set to true
   */
  void setVisiblePermission(Permission visiblePermission);

  /**
   * Access control<br>
   * when false, visible property cannot be set to true
   */
  boolean isVisibleGranted();

  /**
   * Access control<br>
   * when false, visible property cannot be set to true
   */
  void setVisibleGranted(boolean visibleGranted);

  boolean isToggleAction();

  void setToggleAction(boolean toggleAction);

  /**
   * UI processes
   */
  IActionUIFacade getUIFacade();

  /**
   * Checks if this action and all of its parent actions are visible.
   *
   * @since 3.8.1
   */
  boolean isVisibleIncludingParents();

  /**
   * The container of the action, e.g. {@link ITable}.
   * <p>
   * The difference to {@link #getParent()} is that a sub-menus parent is the parent menu while the sub-menus container
   * is still e.g. the {@link ITable}. So the container for a menu hierarchy is always the same.
   *
   * @see #getParent()
   * @see #getParentOfType(Class)
   **/
  IWidget getContainer();

  /**
   * The container of the action node, e.g. a {@link org.eclipse.scout.rt.client.ui.basic.table.ITable ITable} or
   * {@link org.eclipse.scout.rt.client.ui.form.fields.smartfield.ISmartField ISmartField}
   **/
  void setContainerInternal(IWidget container);

  /**
   * @param horizontalAlignment
   *          negative for left and positive for right alignment
   */
  void setHorizontalAlignment(byte horizontalAlignment);

  byte getHorizontalAlignment();

  void setView(boolean visible, boolean enabled);
}

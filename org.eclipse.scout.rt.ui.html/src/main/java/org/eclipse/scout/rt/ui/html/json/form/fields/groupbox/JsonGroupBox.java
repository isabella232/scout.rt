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
package org.eclipse.scout.rt.ui.html.json.form.fields.groupbox;

import org.eclipse.scout.rt.client.ui.action.menu.root.IContextMenu;
import org.eclipse.scout.rt.client.ui.form.fields.IFormField;
import org.eclipse.scout.rt.client.ui.form.fields.LogicalGridLayoutConfig;
import org.eclipse.scout.rt.client.ui.form.fields.groupbox.IGroupBox;
import org.eclipse.scout.rt.client.ui.notification.INotification;
import org.eclipse.scout.rt.ui.html.IUiSession;
import org.eclipse.scout.rt.ui.html.json.FilteredJsonAdapterIds;
import org.eclipse.scout.rt.ui.html.json.IJsonAdapter;
import org.eclipse.scout.rt.ui.html.json.JsonLogicalGridLayoutConfig;
import org.eclipse.scout.rt.ui.html.json.JsonProperty;
import org.eclipse.scout.rt.ui.html.json.form.fields.JsonAdapterProperty;
import org.eclipse.scout.rt.ui.html.json.form.fields.JsonCompositeField;
import org.eclipse.scout.rt.ui.html.json.menu.IJsonContextMenuOwner;
import org.eclipse.scout.rt.ui.html.json.menu.JsonContextMenu;
import org.json.JSONObject;

/**
 * This class creates JSON output for an <code>IGroupBox</code>.
 */
public class JsonGroupBox<GROUP_BOX extends IGroupBox> extends JsonCompositeField<GROUP_BOX, IFormField> implements IJsonContextMenuOwner {

  private JsonContextMenu<IContextMenu> m_jsonContextMenu;

  public JsonGroupBox(GROUP_BOX model, IUiSession uiSession, String id, IJsonAdapter<?> parent) {
    super(model, uiSession, id, parent);
  }

  @Override
  public String getObjectType() {
    return "GroupBox";
  }

  @Override
  protected void attachChildAdapters() {
    super.attachChildAdapters();
    m_jsonContextMenu = new JsonContextMenu<>(getModel().getContextMenu(), this);
    m_jsonContextMenu.init();
  }

  @Override
  protected void disposeChildAdapters() {
    m_jsonContextMenu.dispose();
    super.disposeChildAdapters();
  }

  @Override
  protected void initJsonProperties(GROUP_BOX model) {
    super.initJsonProperties(model);
    putJsonProperty(new JsonProperty<IGroupBox>(IGroupBox.PROP_SUB_LABEL, model) {
      @Override
      protected String modelValue() {
        return getModel().getSubLabel();
      }
    });

    putJsonProperty(new JsonProperty<GROUP_BOX>(IGroupBox.PROP_BORDER_DECORATION, model) {
      @Override
      protected String modelValue() {
        return getModel().getBorderDecoration();
      }
    });
    putJsonProperty(new JsonProperty<GROUP_BOX>(IGroupBox.PROP_BORDER_VISIBLE, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isBorderVisible();
      }
    });
    putJsonProperty(new JsonProperty<GROUP_BOX>(IGroupBox.PROP_EXPANDABLE, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isExpandable();
      }
    });
    putJsonProperty(new JsonProperty<GROUP_BOX>(IGroupBox.PROP_EXPANDED, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isExpanded();
      }
    });
    putJsonProperty(new JsonAdapterProperty<GROUP_BOX>(IGroupBox.PROP_NOTIFICATION, model, getUiSession()) {
      @Override
      protected INotification modelValue() {
        return getModel().getNotification();
      }
    });
    putJsonProperty(new JsonProperty<GROUP_BOX>(IGroupBox.PROP_GRID_COLUMN_COUNT, model) {
      @Override
      protected Integer modelValue() {
        return getModel().getGridColumnCount();
      }
    });
    putJsonProperty(new JsonProperty<GROUP_BOX>(IGroupBox.PROP_SCROLLABLE, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isScrollable().getBooleanValue();
      }
    });
    putJsonProperty(new JsonProperty<GROUP_BOX>(IGroupBox.PROP_BODY_LAYOUT_CONFIG, model) {
      @Override
      protected LogicalGridLayoutConfig modelValue() {
        return getModel().getBodyLayoutConfig();
      }

      @Override
      public Object prepareValueForToJson(Object value) {
        return new JsonLogicalGridLayoutConfig((LogicalGridLayoutConfig) value).toJson();
      }
    });
    putJsonProperty(new JsonProperty<GROUP_BOX>(IGroupBox.PROP_MENU_BAR_POSITION, model) {
      @Override
      protected String modelValue() {
        return getModel().getMenuBarPosition();
      }
    });
    putJsonProperty(new JsonProperty<GROUP_BOX>(IGroupBox.PROP_MENU_BAR_ELLIPSIS_POSITION, model) {
      @Override
      protected String modelValue() {
        return getModel().getMenuBarEllipsisPosition();
      }
    });
    putJsonProperty(new JsonProperty<GROUP_BOX>(IGroupBox.PROP_RESPONSIVE, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isResponsive().getBooleanValue();
      }
    });
  }

  @Override
  public JSONObject toJson() {
    JSONObject json = super.toJson();
    json.put(PROP_MENUS, m_jsonContextMenu.childActionsToJson());
    return json;
  }

  @Override
  public void handleModelContextMenuChanged(FilteredJsonAdapterIds<?> filteredAdapters) {
    addPropertyChangeEvent(PROP_MENUS, filteredAdapters);
  }

  @Override
  protected void handleUiPropertyChange(String propertyName, JSONObject data) {
    if (IGroupBox.PROP_EXPANDED.equals(propertyName)) {
      boolean expanded = data.getBoolean(propertyName);
      addPropertyEventFilterCondition(propertyName, expanded);
      getModel().getUIFacade().setExpandedFromUI(expanded);
    }
    else {
      super.handleUiPropertyChange(propertyName, data);
    }
  }
}

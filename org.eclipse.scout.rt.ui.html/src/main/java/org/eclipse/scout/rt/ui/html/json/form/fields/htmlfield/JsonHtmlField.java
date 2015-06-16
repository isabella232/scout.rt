/*******************************************************************************
 * Copyright (c) 2010 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.rt.ui.html.json.form.fields.htmlfield;

import org.eclipse.scout.rt.client.ui.form.fields.IValueField;
import org.eclipse.scout.rt.client.ui.form.fields.htmlfield.IHtmlField;
import org.eclipse.scout.rt.ui.html.IUiSession;
import org.eclipse.scout.rt.ui.html.json.IJsonAdapter;
import org.eclipse.scout.rt.ui.html.json.JsonEvent;
import org.eclipse.scout.rt.ui.html.json.JsonEventType;
import org.eclipse.scout.rt.ui.html.json.JsonProperty;
import org.eclipse.scout.rt.ui.html.json.form.fields.JsonValueField;

/**
 * This class creates JSON output for an <code>IHtmlField</code>.
 */
public class JsonHtmlField<T extends IHtmlField> extends JsonValueField<T> {

  public JsonHtmlField(T model, IUiSession uiSession, String id, IJsonAdapter<?> parent) {
    super(model, uiSession, id, parent);
  }

  @Override
  public String getObjectType() {
    return "HtmlField";
  }

  @Override
  protected void initJsonProperties(T model) {
    super.initJsonProperties(model);

    // Prevent sending the value to the UI --> only use the (cleaned) display text
    removeJsonProperty(IValueField.PROP_VALUE);
    putJsonProperty(new JsonProperty<IHtmlField>(IValueField.PROP_DISPLAY_TEXT, model) {
      @Override
      protected String modelValue() {
        return getModel().getDisplayText();
      }
    });

    putJsonProperty(new JsonProperty<IHtmlField>(IHtmlField.PROP_SCROLLBARS_ENABLED, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isScrollBarEnabled();
      }
    });
    putJsonProperty(new JsonProperty<IHtmlField>(IHtmlField.PROP_SCROLLBAR_SCROLL_TO_END, model) {
      @Override
      protected Object modelValue() {
        return null; // This property is not really a property, but an event, therefore it does not have a value
      }
    });
    putJsonProperty(new JsonProperty<IHtmlField>(IHtmlField.PROP_SCROLLBAR_SCROLL_TO_ANCHOR, model) {
      @Override
      protected String modelValue() {
        return getModel().getScrollToAnchor();
      }
    });
  }

  @Override
  public void handleUiEvent(JsonEvent event) {
    if (JsonEventType.APP_LINK_ACTION.matches(event.getType())) {
      handleUiAppLinkAction(event);
    }
    else {
      super.handleUiEvent(event);
    }
  }

  protected void handleUiAppLinkAction(JsonEvent event) {
    String ref = event.getData().optString("ref");
    getModel().getUIFacade().fireAppLinkActionFromUI(ref);
  }
}

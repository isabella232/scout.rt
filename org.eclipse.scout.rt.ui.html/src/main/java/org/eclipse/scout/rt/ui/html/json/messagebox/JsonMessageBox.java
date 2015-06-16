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
package org.eclipse.scout.rt.ui.html.json.messagebox;

import org.eclipse.scout.rt.client.ui.messagebox.IMessageBox;
import org.eclipse.scout.rt.client.ui.messagebox.MessageBoxEvent;
import org.eclipse.scout.rt.client.ui.messagebox.MessageBoxListener;
import org.eclipse.scout.rt.ui.html.IUiSession;
import org.eclipse.scout.rt.ui.html.json.AbstractJsonPropertyObserver;
import org.eclipse.scout.rt.ui.html.json.IJsonAdapter;
import org.eclipse.scout.rt.ui.html.json.JsonEvent;
import org.eclipse.scout.rt.ui.html.json.JsonProperty;
import org.eclipse.scout.rt.ui.html.res.BinaryResourceUrlUtility;

public class JsonMessageBox<T extends IMessageBox> extends AbstractJsonPropertyObserver<T> {
  public static final String EVENT_ACTION = "action";
  public static final String EVENT_CLOSED = "closed";

  private MessageBoxListener m_messageBoxListener;

  public JsonMessageBox(T model, IUiSession uiSession, String id, IJsonAdapter<?> parent) {
    super(model, uiSession, id, parent);
  }

  @Override
  public String getObjectType() {
    return "MessageBox";
  }

  @Override
  protected void initJsonProperties(T model) {
    super.initJsonProperties(model);

    putJsonProperty(new JsonProperty<IMessageBox>("iconId", model) {
      @Override
      protected String modelValue() {
        return getModel().iconId();
      }

      @Override
      public Object prepareValueForToJson(Object value) {
        return BinaryResourceUrlUtility.createIconUrl((String) value);
      }
    });
    putJsonProperty(new JsonProperty<IMessageBox>("severity", model) {
      @Override
      protected Integer modelValue() {
        return getModel().severity();
      }
    });
    putJsonProperty(new JsonProperty<IMessageBox>("header", model) {
      @Override
      protected String modelValue() {
        return getModel().header();
      }
    });
    putJsonProperty(new JsonProperty<IMessageBox>("body", model) {
      @Override
      protected String modelValue() {
        return getModel().body();
      }
    });
    putJsonProperty(new JsonProperty<IMessageBox>("yesButtonText", model) {
      @Override
      protected String modelValue() {
        return getModel().yesButtonText();
      }
    });
    putJsonProperty(new JsonProperty<IMessageBox>("noButtonText", model) {
      @Override
      protected String modelValue() {
        return getModel().noButtonText();
      }
    });
    putJsonProperty(new JsonProperty<IMessageBox>("cancelButtonText", model) {
      @Override
      protected String modelValue() {
        return getModel().cancelButtonText();
      }
    });
//  putJsonProperty(new JsonProperty<IMessageBox>("hiddenText", model) {
//  @Override
//  protected String modelValue() {
//    return getModel().getHiddenText(); //FIXME implement
//  }
//});

  }

  @Override
  protected void attachModel() {
    super.attachModel();
    if (m_messageBoxListener != null) {
      throw new IllegalStateException();
    }
    m_messageBoxListener = new P_MessageBoxListener();
    getModel().addMessageBoxListener(m_messageBoxListener);
  }

  @Override
  protected void detachModel() {
    super.detachModel();
    if (m_messageBoxListener == null) {
      throw new IllegalStateException();
    }
    getModel().removeMessageBoxListener(m_messageBoxListener);
    m_messageBoxListener = null;
  }

  protected void handleModelClosed() {
    dispose();
    addActionEvent(EVENT_CLOSED);
  }

  protected void handleModelMessageBoxEvent(MessageBoxEvent event) {
    switch (event.getType()) {
      case MessageBoxEvent.TYPE_CLOSED:
        handleModelClosed();
        break;
      default:
        // NOP
    }
  }

  @Override
  public void handleUiEvent(JsonEvent event) {
    if (EVENT_ACTION.equals(event.getType())) {
      handleUiAction(event);
    }
    else {
      super.handleUiEvent(event);
    }
  }

  private void handleUiAction(JsonEvent event) {
    String option = event.getData().getString("option");
    int resultOption = -1;
    if ("yes".equals(option)) {
      resultOption = IMessageBox.YES_OPTION;
    }
    else if ("no".equals(option)) {
      resultOption = IMessageBox.NO_OPTION;
    }
    else if ("cancel".equals(option)) {
      resultOption = IMessageBox.CANCEL_OPTION;
    }
    if (resultOption == -1) {
      throw new IllegalStateException("Undefined option" + option);
    }

    getModel().getUIFacade().setResultFromUI(resultOption);
  }

  private class P_MessageBoxListener implements MessageBoxListener {
    @Override
    public void messageBoxChanged(MessageBoxEvent event) {
      handleModelMessageBoxEvent(event);
    }
  }
}

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
package org.eclipse.scout.rt.ui.html.json.form.fields.wizard;

import java.util.List;

import org.eclipse.scout.rt.client.ui.form.IForm;
import org.eclipse.scout.rt.client.ui.form.fields.wizard.IWizardProgressField;
import org.eclipse.scout.rt.client.ui.wizard.IWizard;
import org.eclipse.scout.rt.client.ui.wizard.IWizardStep;
import org.eclipse.scout.rt.ui.html.IUiSession;
import org.eclipse.scout.rt.ui.html.json.IJsonAdapter;
import org.eclipse.scout.rt.ui.html.json.JsonEvent;
import org.eclipse.scout.rt.ui.html.json.JsonObjectUtility;
import org.eclipse.scout.rt.ui.html.json.JsonProperty;
import org.eclipse.scout.rt.ui.html.json.form.fields.JsonFormField;
import org.eclipse.scout.rt.ui.html.res.BinaryResourceUrlUtility;
import org.json.JSONArray;
import org.json.JSONObject;

public class JsonWizardProgressField<T extends IWizardProgressField> extends JsonFormField<T> {

  // from UI
  private static final String EVENT_STEP_CLICKED = "stepClicked";

  public JsonWizardProgressField(T model, IUiSession uiSession, String id, IJsonAdapter<?> parent) {
    super(model, uiSession, id, parent);
  }

  @Override
  public String getObjectType() {
    return "WizardProgressField";
  }

  @Override
  protected void initJsonProperties(T model) {
    super.initJsonProperties(model);
    putJsonProperty(new JsonProperty<T>(IWizardProgressField.PROP_WIZARD_STEPS, model) {
      @Override
      protected List<IWizardStep<? extends IForm>> modelValue() {
        return getModel().getWizardSteps();
      }

      @Override
      public Object prepareValueForToJson(Object value) {
        @SuppressWarnings("unchecked")
        List<IWizardStep<? extends IForm>> wizardSteps = (List<IWizardStep<? extends IForm>>) value;
        JSONArray jsonSteps = new JSONArray();
        if (wizardSteps != null) {
          for (IWizardStep<? extends IForm> wizardStep : wizardSteps) {
            jsonSteps.put(wizardStepToJson(wizardStep));
          }
        }
        return jsonSteps;
      }
    });
    putJsonProperty(new JsonProperty<T>(IWizardProgressField.PROP_ACTIVE_WIZARD_STEP, model) {
      @Override
      protected IWizardStep<? extends IForm> modelValue() {
        return getModel().getActiveWizardStep();
      }

      @Override
      public Object prepareValueForToJson(Object value) {
        @SuppressWarnings("unchecked")
        IWizardStep<? extends IForm> activeWizardStep = (IWizardStep<? extends IForm>) value;
        return getStepIndex(activeWizardStep);
      }
    });
  }

  protected JSONObject wizardStepToJson(IWizardStep<? extends IForm> wizardStep) {
    JSONObject jsonStep = JsonObjectUtility.newOrderedJSONObject();
    // TODO BSH Html??? Visible???
    jsonStep.put("index", getStepIndex(wizardStep));
    jsonStep.put("title", wizardStep.getTitle());
    jsonStep.put("description", wizardStep.getDescriptionHtml());
    jsonStep.put("enabled", wizardStep.isEnabled());
    jsonStep.put("iconId", BinaryResourceUrlUtility.createIconUrl(wizardStep.getIconId()));
    jsonStep.put("tooltipText", wizardStep.getTooltipText());
    return jsonStep;
  }

  protected Integer getStepIndex(IWizardStep<? extends IForm> wizardStep) {
    if (wizardStep != null) {
      IWizard wizard = getModel().getWizard();
      if (wizard != null) {
        return wizard.getStepIndex(wizardStep);
      }
    }
    return null;
  }

  @Override
  public void handleUiEvent(JsonEvent event) {
    if (EVENT_STEP_CLICKED.equals(event.getType())) {
      handleUiStepClicked(event);
    }
    else {
      super.handleUiEvent(event);
    }
  }

  protected void handleUiStepClicked(JsonEvent event) {
    int targetStepIndex = event.getData().optInt("stepIndex", -1);
    getModel().getUIFacade().activateStepFromUI(targetStepIndex);
  }
}

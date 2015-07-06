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
package org.eclipse.scout.rt.client.ui.wizard;

import java.net.URL;
import java.util.List;

import org.eclipse.scout.commons.ITypeWithClassId;
import org.eclipse.scout.commons.beans.IPropertyObserver;
import org.eclipse.scout.commons.exception.ProcessingException;
import org.eclipse.scout.commons.exception.VetoException;
import org.eclipse.scout.rt.client.ui.IAppLinkCapable;
import org.eclipse.scout.rt.client.ui.desktop.IDesktop;
import org.eclipse.scout.rt.client.ui.form.IForm;

public interface IWizard extends IPropertyObserver, ITypeWithClassId, IAppLinkCapable {

  static enum CloseType {
    /**
     * wizard is not yet closed so the close state is unknown, see also {@link IWizard#close()},
     * {@link IWizard#isClosed()}, {@link IWizard#getCloseType()}
     */
    Unknown,
    /**
     * wizard was just closed, see also {@link IWizard#close()}, {@link IWizard#isClosed()},
     * {@link IWizard#getCloseType()}
     */
    Closed,
    /**
     * wizard was finished, see also {@link IWizard#doFinish()}, {@link IWizard#isClosed()},
     * {@link IWizard#getCloseType()}
     */
    Finished,
    /**
     * wizard was cancelled, see also {@link IWizard#doCancel()}, {@link IWizard#isClosed()},
     * {@link IWizard#getCloseType()}
     */
    Cancelled,

    /**
     * wizard was suspended, see also {@link IWizard#doSuspend()}, {@link IWizard#isClosed()},
     * {@link IWizard#getCloseType()}
     */
    Suspended,
  }

  String PROP_TITLE = "title";
  String PROP_TITLE_HTML = "titleHtml";
  String PROP_SUB_TITLE = "subTitle";
  String PROP_TOOLTIP_TEXT = "tooltipText";
  String PROP_ICON_ID = "iconId";
  String PROP_WIZARD_NO = "wizardNo";
  /**
   * {@link IForm}
   */
  String PROP_WIZARD_FORM = "wizardForm";
  /**
   * boolean
   */
  String PROP_CLOSED = "closed";
  /**
   * {@link CloseType}
   */
  String PROP_CLOSE_TYPE = "closeType";

  void addWizardListener(WizardListener listener);

  void removeWizardListener(WizardListener listener);

  /**
   * when the wizard is changed (for example the state) all these changes are
   * accumulated and then fired in single events Therefore the whole block is
   * normally inside a try...finally
   *
   * @see IWizard#doNextStep()
   */
  void setChanging(boolean b);

  boolean isChanging();

  /**
   * Hint for wizard container form
   */
  int getDisplayHint();

  /**
   * Hint for wizard container form
   */
  void setDisplayHint(int displayHint);

  /**
   * Hint for wizard container form
   */
  String getDisplayViewId();

  /**
   * Hint for wizard container form
   */
  void setDisplayViewId(String viewId);

  /**
   * Hint for wizard container form
   */
  boolean isModal();

  /**
   * Hint for wizard container form
   */
  void setModal(boolean modal);

  /**
   * Hint for wizard container form
   */
  String getTitle();

  /**
   * Hint for wizard container form
   */
  void setTitle(String title);

  /**
   * Hint for wizard container form
   */
  String getSubTitle();

  /**
   * Hint for wizard container form
   */
  void setSubTitle(String subTitle);

  String getTitleHtml();

  void setTitleHtml(String subTitleHtml);

  String getTooltipText();

  void setTooltipText(String tooltipText);

  String getIconId();

  void setIconId(String iconId);

  String getWizardNo();

  void setWizardNo(String wizardNo);

  /**
   * No more operations are possible on a closed wizard.
   */
  boolean isClosed();

  /**
   * @return the type in which the wizard was closed
   */
  CloseType getCloseType();

  /**
   * start the wizard
   */
  void start() throws ProcessingException;

  /**
   * Convenience method to get the current desktop.
   */
  IDesktop getDesktop() throws ProcessingException;

  /**
   * @return current wizard form or <code>null</code> if there is no current
   *         wizard form.
   */
  IForm getWizardForm();

  /**
   * Set current wizard form or <code>null</code> if there is no current wizard
   * form. Use handle
   */
  void setWizardForm(IForm form);

  /**
   * Wait until form is closed<br>
   * If the form is modal this method returns just after the modal handler has
   * terminated<br>
   * If the form is non-modal this starts a sub event dispatcher that loops (and
   * blocks) until form handling is false (i.e. form has been closed)
   */
  void waitFor() throws ProcessingException;

  int WAIT_FOR_ERROR_CODE = 69218;

  /**
   * This method by default calls {@link #execRefreshButtonPolicy()} which is
   * used to make then wizard buttons visible/invisible/enabled/disabled based
   * on the current form and wizard state.
   */
  void refreshButtonPolicy();

  /**
   * close wizard (forced suspend)
   */
  void close() throws ProcessingException;

  /**
   * @return all available steps, see also {@link #getSteps()}
   */
  List<IWizardStep<? extends IForm>> getAvailableSteps();

  /**
   * set all available steps, see also {@link #setSteps(List)}
   */
  void setAvailableSteps(List<IWizardStep<? extends IForm>> steps);

  /**
   * @return all steps including history, current, future
   */
  List<IWizardStep<? extends IForm>> getSteps();

  /**
   * set the list of active steps
   */
  void setSteps(IWizardStep<?>... steps);

  /**
   * set the list of active steps
   */
  void setSteps(List<IWizardStep<? extends IForm>> steps);

  <T extends IWizardStep<? extends IForm>> T getAvailableStep(Class<T> type);

  <T extends IWizardStep<? extends IForm>> T getStep(Class<T> type);

  IWizardStep<? extends IForm> getStep(int index);

  IWizardStep<? extends IForm> getStepBySimpleClassName(String simpleClassName);

  IWizardStep<? extends IForm> getStepByClassName(String className);

  int getStepIndex(IWizardStep<? extends IForm> step);

  /**
   * Convenience method
   *
   * @return {@link IWizardStep#STEP_NEXT} or {@link IWizardStep#STEP_PREVIOUS} Note: If from or to is null then
   *         STEP_NEXT is returned.
   */
  int getStepKind(IWizardStep<? extends IForm> from, IWizardStep<? extends IForm> to);

  /**
   * Convenience method
   *
   * @return an array of all steps between from and to
   */
  List<IWizardStep<? extends IForm>> getStepSpan(IWizardStep<? extends IForm> from, boolean includeFrom, IWizardStep<? extends IForm> to, boolean includeTo);

  /**
   * Convenience method
   *
   * @return step before active step
   */
  IWizardStep<? extends IForm> getPreviousStep();

  /**
   * Convenience method
   *
   * @return step after active step
   */
  IWizardStep<? extends IForm> getNextStep();

  /**
   * Convenience method
   *
   * @return first step before active step that is enabled
   */
  IWizardStep<? extends IForm> getPreviousEnabledStep();

  /**
   * Convenience method
   *
   * @return first step after active step that is enabled
   */
  IWizardStep<? extends IForm> getNextEnabledStep();

  /**
   * Set and activate a new wizard state, throws a {@link VetoException} if the
   * new step could not be activated, for example if the currently active step
   * vetoed in its deactivate() method Detailed: 1. calculate direction of
   * change, either {@link IWizardStep#STEP_NEXT} or {@link IWizardStep#STEP_PREVIOUS} 2. call
   * {@link IWizardStep#deactivate(int)} on the old step if that step exists 3.
   * call {@link IWizardStep#activate(int)} on the new step if that step exists
   * When calling {@link #activateStep(null)} with a null argument it simply
   * calls deactivate on the existing step.
   */
  void activateStep(IWizardStep<? extends IForm> step) throws ProcessingException;

  /**
   * set the current wizard state
   *
   * @param jumpForward
   *          true simply jumps to the new step, false activates/deactivates
   *          every step inbetween the old and the new step
   * @param jumpBackward
   *          true simply jumps to the new step, false activates/deactivates
   *          every step inbetween the old and the new step The jump parameters
   *          are only relevant if the new step is not the direct previous or
   *          next step of the old step.
   */
  void activateStep(IWizardStep<? extends IForm> step, boolean jumpForward, boolean jumpBackward) throws ProcessingException;

  IWizardStep<? extends IForm> getActiveStep();

  /**
   * next step
   */
  void doNextStep() throws ProcessingException;

  /**
   * previous step
   */
  void doPreviousStep() throws ProcessingException;

  /**
   * finish
   */
  void doFinish() throws ProcessingException;

  /**
   * cancel
   */
  void doCancel() throws ProcessingException;

  /**
   * suspend
   */
  void doSuspend() throws ProcessingException;

  /**
   * reset
   */
  void doReset() throws ProcessingException;

  /**
   * This is a delegate method that is normally called by the wizard status
   * field in the {@link IWizardContainerForm} whenever a link is
   * clicked.
   */
  @Override
  void doAppLinkAction(String ref) throws ProcessingException;

  /**
   * @deprecated use {@link #doAppLinkAction(String)} instead
   */
  @Deprecated
  void doHyperlinkAction(URL url, String path, boolean local) throws ProcessingException;

  void doWizardStepAction(IWizardStep<? extends IForm> wizardStep) throws ProcessingException;

  /**
   * The container form is created when it does not exist already. By default
   * the container form is created upon start of the wizard.
   */
  IWizardContainerForm createContainerForm() throws ProcessingException;

  IWizardContainerForm getContainerForm();

  /**
   * The wizard was started and is active and open
   */
  boolean isOpen();
}

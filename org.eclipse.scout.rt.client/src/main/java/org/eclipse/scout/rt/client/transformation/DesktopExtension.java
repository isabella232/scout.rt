/*
 * Copyright (c) 2010-2017 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.rt.client.transformation;

import org.eclipse.scout.rt.client.extension.ui.desktop.AbstractDesktopExtension;
import org.eclipse.scout.rt.client.extension.ui.desktop.DesktopChains.DesktopClosingChain;
import org.eclipse.scout.rt.client.extension.ui.desktop.DesktopChains.DesktopInitChain;
import org.eclipse.scout.rt.client.extension.ui.desktop.DesktopChains.DesktopPageDetailFormChangedChain;
import org.eclipse.scout.rt.client.extension.ui.desktop.DesktopChains.DesktopPageDetailTableChangedChain;
import org.eclipse.scout.rt.client.ui.basic.table.ITable;
import org.eclipse.scout.rt.client.ui.desktop.AbstractDesktop;
import org.eclipse.scout.rt.client.ui.form.IForm;
import org.eclipse.scout.rt.platform.BEANS;

public class DesktopExtension extends AbstractDesktopExtension<AbstractDesktop> {

  public DesktopExtension(AbstractDesktop owner) {
    super(owner);
  }

  @Override
  public void execInit(DesktopInitChain chain) {
    super.execInit(chain);
    BEANS.get(IDeviceTransformationService.class).getDeviceTransformer().transformDesktop();
  }

  @Override
  public void execClosing(DesktopClosingChain chain) {
    super.execClosing(chain);
    BEANS.get(IDeviceTransformationService.class).getDeviceTransformer().notifyDesktopClosing();
  }

  @Override
  public void execPageDetailFormChanged(DesktopPageDetailFormChangedChain chain, IForm oldForm, IForm newForm) {
    super.execPageDetailFormChanged(chain, oldForm, newForm);
    BEANS.get(IDeviceTransformationService.class).getDeviceTransformer().notifyPageDetailFormChanged(newForm);
  }

  @Override
  public void execPageDetailTableChanged(DesktopPageDetailTableChangedChain chain, ITable oldTable, ITable newTable) {
    super.execPageDetailTableChanged(chain, oldTable, newTable);
    BEANS.get(IDeviceTransformationService.class).getDeviceTransformer().notifyPageDetailTableChanged(newTable);
  }
}

/*
 * Copyright (c) 2010-2021 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.rt.platform.namespace;

public final class ScoutNamespace implements INamespace {

  public static final String ID = "scout";
  public static final double ORDER = 5100;

  @Override
  public String getId() {
    return ID;
  }

  @Override
  public double getOrder() {
    return ORDER;
  }
}

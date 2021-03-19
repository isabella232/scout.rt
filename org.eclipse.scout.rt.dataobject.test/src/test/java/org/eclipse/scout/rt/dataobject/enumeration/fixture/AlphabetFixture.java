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
package org.eclipse.scout.rt.dataobject.enumeration.fixture;

import org.eclipse.scout.rt.dataobject.enumeration.EnumName;
import org.eclipse.scout.rt.dataobject.enumeration.IEnum;

@EnumName("scout.AlphabetFixture")
public enum AlphabetFixture implements IEnum {

  A("a"),
  B("b"),
  C("c");

  private final String m_stringValue;

  AlphabetFixture(String stringValue) {
    this.m_stringValue = stringValue;
  }

  @Override
  public String stringValue() {
    return m_stringValue;
  }
}

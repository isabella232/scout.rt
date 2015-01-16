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
package org.eclipse.scout.commons;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import java.math.BigDecimal;
import java.math.BigInteger;

import org.eclipse.scout.rt.testing.commons.ScoutAssert;
import org.junit.Test;

public class NumberUtilityTest {

  /**
   * Test method for {@link org.eclipse.scout.commons.NumberUtility#numberToBigDecimal(java.lang.Number)}.
   */
  @Test
  public void testToBigDecimalNumber() {
    ScoutAssert.assertComparableEquals(BigDecimal.valueOf(25d), NumberUtility.numberToBigDecimal(Integer.valueOf(25)));
    ScoutAssert.assertComparableEquals(BigDecimal.valueOf(25d), NumberUtility.numberToBigDecimal(Long.valueOf(25)));
    ScoutAssert.assertComparableEquals(BigDecimal.valueOf(25.987d), NumberUtility.numberToBigDecimal(Float.valueOf(25.987f)));
    ScoutAssert.assertComparableEquals(BigDecimal.valueOf(25.987d), NumberUtility.numberToBigDecimal(Double.valueOf(25.987d)));
    ScoutAssert.assertComparableEquals(BigDecimal.valueOf(-25d), NumberUtility.numberToBigDecimal(Double.valueOf(-25d)));
    ScoutAssert.assertComparableEquals(BigDecimal.valueOf(-25d), NumberUtility.numberToBigDecimal(BigDecimal.valueOf(-25d)));
    ScoutAssert.assertComparableEquals(BigDecimal.valueOf(-25d), NumberUtility.numberToBigDecimal(BigInteger.valueOf(-25)));

    assertNull(NumberUtility.numberToBigDecimal(Double.valueOf(Double.NEGATIVE_INFINITY)));
    assertNull(NumberUtility.numberToBigDecimal(Double.valueOf(Double.POSITIVE_INFINITY)));
    assertNull(NumberUtility.numberToBigDecimal(Double.valueOf(Double.NaN)));
    assertNull(NumberUtility.numberToBigDecimal(Float.valueOf(Float.NEGATIVE_INFINITY)));
    assertNull(NumberUtility.numberToBigDecimal(Float.valueOf(Float.POSITIVE_INFINITY)));
    assertNull(NumberUtility.numberToBigDecimal(Float.valueOf(Float.NaN)));
  }

  @Test
  public void testSumNumbers() {
    assertEquals(new BigDecimal("1000000000000000000000000000000000000000000000000000148.225"),
        NumberUtility.sum(Long.valueOf(100),
            new BigInteger("1000000000000000000000000000000000000000000000000000000"),
            BigDecimal.ONE,
            BigDecimal.ZERO,
            Double.valueOf(2.225d),
            Float.NaN,
            Float.NEGATIVE_INFINITY,
            Double.POSITIVE_INFINITY,
            Integer.valueOf(45)));
  }

  @Test
  public void testParseEmptyString() {
    assertEquals(0d, NumberUtility.parseDouble(""), 0.00001d);
    assertEquals(0l, NumberUtility.parseLong(""));
    assertEquals(0, NumberUtility.parseInt(""));

  }
}

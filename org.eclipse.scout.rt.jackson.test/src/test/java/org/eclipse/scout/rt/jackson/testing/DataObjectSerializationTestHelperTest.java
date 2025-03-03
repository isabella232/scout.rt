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
package org.eclipse.scout.rt.jackson.testing;

import static org.eclipse.scout.rt.testing.platform.util.ScoutAssert.assertEqualsWithComparisonFailure;

import org.eclipse.scout.rt.dataobject.DoEntity;
import org.eclipse.scout.rt.platform.BEANS;
import org.junit.BeforeClass;
import org.junit.Test;

public class DataObjectSerializationTestHelperTest {

  protected static DataObjectSerializationTestHelper s_testHelper;

  protected static String JSON = "{\n" +
      "  \"_type\" : \"foo\",\n" +
      "  \"attribute\" : \"bar\"\n" +
      "}";

  protected static DoEntity ENTITY;

  @BeforeClass
  public static void beforeClass() {
    s_testHelper = BEANS.get(DataObjectSerializationTestHelper.class);
    ENTITY = BEANS.get(DoEntity.class);
    ENTITY.put("_type", "foo");
    ENTITY.put("attribute", "bar");
  }

  @Test
  public void testAssertJsonEqualsStringString() {
    s_testHelper.assertJsonEquals(JSON, JSON);
    s_testHelper.assertJsonEquals(JSON, JSON + "   \n\r");
    s_testHelper.assertJsonEquals((String) null, (String) null);
  }

  @Test
  public void testAssertJsonEqualsStringIDoEntity() {
    s_testHelper.assertJsonEquals(JSON, ENTITY);
  }

  @Test
  public void testAssertJsonEqualsIDoEntityString() {
    s_testHelper.assertJsonEquals(ENTITY, JSON);
  }

  @Test
  public void testAssertJsonEqualsIDoEntityIDoEntity() {
    s_testHelper.assertJsonEquals(ENTITY, ENTITY);
  }

  @Test
  public void testAssertJsonEqualsURLString() {
    s_testHelper.assertJsonEquals(DataObjectSerializationTestHelperTest.class.getResource("DataObjectSerializationTestHelperTest.json"), JSON);
  }

  @Test(expected = AssertionError.class)
  public void testAssertJsonEqualsURLString_invalidJson() {
    s_testHelper.assertJsonEquals(DataObjectSerializationTestHelperTest.class.getResource("fooBar.json"), JSON);
  }

  @Test
  public void testAssertJsonEqualsURLIDoEntity() {
    s_testHelper.assertJsonEquals(DataObjectSerializationTestHelperTest.class.getResource("DataObjectSerializationTestHelperTest.json"), ENTITY);
  }

  @Test(expected = AssertionError.class)
  public void testAssertJsonEqualsURLIDoEntity_invalidJson() {
    s_testHelper.assertJsonEquals(DataObjectSerializationTestHelperTest.class.getResource("fooBar.json"), ENTITY);
  }

  @Test
  public void testStringify() {
    s_testHelper.assertJsonEquals(JSON, s_testHelper.stringify(ENTITY));
  }

  @Test
  public void testParse() {
    DoEntity entity = s_testHelper.parse(JSON, DoEntity.class);
    assertEqualsWithComparisonFailure(ENTITY, entity);
  }

  @Test
  public void testCloneT() {
    assertEqualsWithComparisonFailure(ENTITY, s_testHelper.clone(ENTITY));
  }
}

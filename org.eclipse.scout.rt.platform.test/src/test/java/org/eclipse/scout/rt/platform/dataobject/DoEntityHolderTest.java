/*
 * Copyright (c) BSI Business Systems Integration AG. All rights reserved.
 * http://www.bsiag.com/
 */
package org.eclipse.scout.rt.platform.dataobject;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.eclipse.scout.rt.platform.BEANS;
import org.eclipse.scout.rt.platform.dataobject.fixture.EntityFixtureDo;
import org.eclipse.scout.rt.testing.platform.dataobject.DataObjectTestHelper;
import org.junit.Test;

public class DoEntityHolderTest {

  protected static DataObjectTestHelper s_dataObjectTestUtility = BEANS.get(DataObjectTestHelper.class);

  @Test
  public void testSetGetValue() {
    DoEntityHolder<DoEntity> holder = new DoEntityHolder<>();
    assertNull(holder.getValue());
    DoEntity entity = new DoEntity();
    entity.put("foo", "bar");
    holder.setValue(entity);
    assertEquals(entity, holder.getValue());
  }

  static class P_FixtureDoEntityHolder extends DoEntityHolder<EntityFixtureDo> {
    private static final long serialVersionUID = 1L;
  }

  @Test
  public void testGetHolderType() {
    DoEntityHolder<DoEntity> holder = new DoEntityHolder<>(DoEntity.class);
    assertEquals(DoEntity.class, holder.getHolderType());

    DoEntityHolder<EntityFixtureDo> holder2 = new P_FixtureDoEntityHolder();
    assertEquals(EntityFixtureDo.class, holder2.getHolderType());

    DoEntityHolder<EntityFixtureDo> holder3 = new P_FixtureDoEntityHolder();
    holder3.setValue(new EntityFixtureDo());
    assertEquals(EntityFixtureDo.class, holder3.getHolderType());
  }
}
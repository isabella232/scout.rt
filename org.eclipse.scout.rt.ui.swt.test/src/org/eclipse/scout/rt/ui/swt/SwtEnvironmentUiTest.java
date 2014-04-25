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
package org.eclipse.scout.rt.ui.swt;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.eclipse.scout.commons.annotations.ClassId;
import org.eclipse.scout.commons.annotations.Order;
import org.eclipse.scout.commons.exception.ProcessingException;
import org.eclipse.scout.rt.client.testenvironment.TestEnvironmentClientSession;
import org.eclipse.scout.rt.client.ui.form.AbstractForm;
import org.eclipse.scout.rt.client.ui.form.fields.groupbox.AbstractGroupBox;
import org.eclipse.scout.rt.client.ui.form.fields.stringfield.AbstractStringField;
import org.eclipse.scout.rt.shared.data.basic.FontSpec;
import org.eclipse.scout.rt.ui.swt.SwtEnvironmentUiTest.TestForm.MainBox.StringField;
import org.eclipse.scout.rt.ui.swt.basic.ISwtScoutComposite;
import org.eclipse.scout.rt.ui.swt.form.ISwtScoutForm;
import org.eclipse.scout.rt.ui.swt.form.fields.ISwtScoutFormField;
import org.eclipse.scout.rt.ui.swt.keystroke.ISwtKeyStroke;
import org.eclipse.scout.rt.ui.swt.keystroke.ISwtKeyStrokeFilter;
import org.eclipse.scout.rt.ui.swt.util.ColorFactory;
import org.eclipse.scout.rt.ui.swt.util.FontRegistry;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.graphics.Font;
import org.eclipse.swt.widgets.Control;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.swt.widgets.Widget;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

/**
 * Test for {@link AbstractSwtEnvironment}
 */
public class SwtEnvironmentUiTest {

  private TestForm m_testForm;
  private static final String TEST_CLASS_ID = "testClassId";
  private static final String TEST_MAIN_BOX_CLASS_ID = "mainBoxId";

  @Before
  public void setUp() throws ProcessingException {
    m_testForm = new TestForm();
    m_testForm.setClassId(TEST_CLASS_ID);
  }

  @After
  public void tearDown() {
    System.clearProperty(AbstractSwtEnvironment.PROP_TEST_IDS_ENABLED);
  }

  /**
   * Test for {@link AbstractSwtEnvironment#assignTestId}
   */
  @Test
  public void testClassIdAssignedForm() {
    System.setProperty(AbstractSwtEnvironment.PROP_TEST_IDS_ENABLED, "true");
    AbstractSwtEnvironment env = createEnvironment();
    ISwtScoutForm f = env.createForm(new Shell(), m_testForm);
    assertEquals(TEST_CLASS_ID, getTestId(f));
  }

  /**
   * Test for {@link AbstractSwtEnvironment#assignTestId}
   */
  @Test
  public void testClassIdAssignedField() {
    System.setProperty(AbstractSwtEnvironment.PROP_TEST_IDS_ENABLED, "true");
    AbstractSwtEnvironment env = createEnvironment();
    ISwtScoutFormField f = env.createFormField(new Shell(), m_testForm.getStringField());
    assertEquals(TEST_CLASS_ID, getTestId(f));
  }

  /**
   * Test for {@link AbstractSwtEnvironment#assignTestId}
   */
  @Test
  public void testClassIdAssignedGroupBox() {
    System.setProperty(AbstractSwtEnvironment.PROP_TEST_IDS_ENABLED, "true");
    AbstractSwtEnvironment env = createEnvironment();
    ISwtScoutFormField f = env.createFormField(new Shell(), m_testForm.getRootGroupBox());
    assertEquals(TEST_MAIN_BOX_CLASS_ID, getTestId(f));
  }

  /**
   * Test for {@link AbstractSwtEnvironment#assignTestId}
   */
  @Test
  public void testClassIdNotAssignedDisabled() throws Exception {
    System.setProperty(AbstractSwtEnvironment.PROP_TEST_IDS_ENABLED, "false");
    AbstractSwtEnvironment env = createEnvironment();
    ISwtScoutForm f = env.createForm(new Shell(), m_testForm);
    assertNull(getTestId(f));
  }

  /**
   * Test for {@link AbstractSwtEnvironment#assignTestId}
   */
  @Test
  public void testClassIdNotAssignedByDefault() throws Exception {
    AbstractSwtEnvironment env = createEnvironment();
    ISwtScoutForm f = env.createForm(new Shell(), m_testForm);
    assertNull(getTestId(f));
  }

  private AbstractSwtEnvironment createEnvironment() {
    return new AbstractSwtEnvironment(null, null, TestEnvironmentClientSession.class) {
      @Override
      public Color getColor(String scoutColor) {
        return new ColorFactory(Display.getCurrent()).getColor(scoutColor);
      }

      @Override
      public void addKeyStrokeFilter(Widget c, ISwtKeyStrokeFilter filter) {
        //ignore
      }

      @Override
      public void addKeyStroke(Widget widget, ISwtKeyStroke stoke) {
        //ignore
      }

      @Override
      public Font getFont(FontSpec scoutFont, Font templateFont) {
        return new FontRegistry(Display.getCurrent()).getFont(scoutFont, templateFont);
      }

      @Override
      public Display getDisplay() {
        return Display.getCurrent();
      }
    };
  }

  private Object getTestId(ISwtScoutComposite c) {
    Control swtField = c.getSwtField();
    if (swtField != null) {
      return swtField.getData(AbstractSwtEnvironment.COMPONENT_TEST_KEY);
    }
    else if (c.getSwtContainer() != null) {
      return c.getSwtContainer().getData(AbstractSwtEnvironment.COMPONENT_TEST_KEY);
    }
    return null;
  }

  class TestForm extends AbstractForm {

    public StringField getStringField() {
      return getFieldByClass(StringField.class);
    }

    public TestForm() throws ProcessingException {
      super();
    }

    @Order(10.0)
    @ClassId(TEST_MAIN_BOX_CLASS_ID)
    public class MainBox extends AbstractGroupBox {

      @Order(10.0)
      @ClassId(TEST_CLASS_ID)
      public class StringField extends AbstractStringField {
      }
    }
  }

}

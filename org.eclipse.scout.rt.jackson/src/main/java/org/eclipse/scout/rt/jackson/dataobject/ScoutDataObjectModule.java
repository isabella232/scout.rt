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
package org.eclipse.scout.rt.jackson.dataobject;

import javax.annotation.PostConstruct;

import org.eclipse.scout.rt.dataobject.DoEntity;
import org.eclipse.scout.rt.platform.BEANS;
import org.eclipse.scout.rt.platform.Bean;

import com.fasterxml.jackson.core.Version;
import com.fasterxml.jackson.core.json.PackageVersion;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Jackson {@link Module} that adds {@link ObjectMapper} support for Scout data object types like ({@code DoEntity},
 * {@code DoValue} and {@code DoList}.
 */
@Bean
public class ScoutDataObjectModule extends Module {

  private static final String NAME = "ScoutDataObjectModule";

  /**
   * Default name of type attribute used for serialization.
   *
   * @see ScoutDataObjectModuleContext#getTypeAttributeName()
   */
  protected static final String DEFAULT_TYPE_ATTRIBUTE_NAME = "_type";

  /**
   * Default name of type version attribute used for serialization.
   *
   * @see ScoutDataObjectModuleContext#getTypeAttributeName()
   */
  protected static final String DEFAULT_TYPE_VERSION_ATTRIBUTE_NAME = "_typeVersion";

  private ScoutDataObjectModuleContext m_moduleContext;

  @PostConstruct
  protected void init() {
    m_moduleContext = BEANS.get(ScoutDataObjectModuleContext.class)
        .withTypeAttributeName(DEFAULT_TYPE_ATTRIBUTE_NAME)
        .withTypeVersionAttributeName(DEFAULT_TYPE_VERSION_ATTRIBUTE_NAME);
  }

  public ScoutDataObjectModuleContext getModuleContext() {
    return m_moduleContext;
  }

  /**
   * Setup {@link ScoutDataObjectModule} to use given {@code typeAttributeName} as type attribute name.
   */
  public ScoutDataObjectModule withTypeAttributeName(String typeAttributeName) {
    m_moduleContext.withTypeAttributeName(typeAttributeName);
    return this;
  }

  /**
   * Setup {@link ScoutDataObjectModule} to use given {@code typeVersionAttributeName} as type version attribute name.
   */
  public ScoutDataObjectModule withTypeVersionAttributeName(String typeVersionAttributeName) {
    m_moduleContext.withTypeVersionAttributeName(typeVersionAttributeName);
    return this;
  }

  /**
   * Setup {@link ScoutDataObjectModule} to ignore type attributes when deserializing JSON document structures and
   * create raw {@link DoEntity} instances instead.
   */
  public ScoutDataObjectModule withIgnoreTypeAttribute(boolean ignoreTypeAttribute) {
    m_moduleContext.withIgnoreTypeAttribute(ignoreTypeAttribute);
    return this;
  }

  @Override
  public String getModuleName() {
    return NAME;
  }

  @Override
  public Version version() {
    return PackageVersion.VERSION;
  }

  @Override
  public void setupModule(SetupContext context) {
    prepareScoutDataModuleContext(m_moduleContext);

    context.addSerializers(BEANS.get(DataObjectSerializers.class).withModuleContext(m_moduleContext));
    context.addDeserializers(BEANS.get(DataObjectDeserializers.class).withModuleContext(m_moduleContext));

    context.addKeySerializers(BEANS.get(DataObjectMapKeySerializers.class).withModuleContext(m_moduleContext));
    context.addKeyDeserializers(BEANS.get(DataObjectMapKeyDeserializers.class).withModuleContext(m_moduleContext));

    context.addTypeModifier(BEANS.get(DataObjectTypeModifier.class).withModuleContext(m_moduleContext));
    context.insertAnnotationIntrospector(BEANS.get(DataObjectAnnotationIntrospector.class).withModuleContext(m_moduleContext));
  }

  /**
   * Override this method to add custom properties to {@code moduleContext}.
   * <p>
   * TODO [11.0] pbz remove this method > consider move {@link #init()} to {@link JacksonDataObjectMapper}
   *
   * @deprecated use JacksonDataObjectMapper#prepareScoutDataModuleContext(ScoutDataObjectModuleContext) instead
   */
  @Deprecated
  protected void prepareScoutDataModuleContext(ScoutDataObjectModuleContext moduleContext) {
    // NOP
  }

  @Override
  public int hashCode() {
    return NAME.hashCode();
  }

  @Override
  public boolean equals(Object o) {
    return this == o;
  }
}

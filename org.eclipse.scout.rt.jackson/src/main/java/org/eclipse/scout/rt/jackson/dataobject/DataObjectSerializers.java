/*******************************************************************************
 * Copyright (c) 2010-2018 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.rt.jackson.dataobject;

import java.util.Date;
import java.util.Locale;

import org.eclipse.scout.rt.platform.Bean;
import org.eclipse.scout.rt.platform.dataobject.DoList;
import org.eclipse.scout.rt.platform.dataobject.DoValue;
import org.eclipse.scout.rt.platform.dataobject.IDoEntity;
import org.eclipse.scout.rt.platform.resource.BinaryResource;

import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.SerializationConfig;
import com.fasterxml.jackson.databind.jsontype.TypeSerializer;
import com.fasterxml.jackson.databind.ser.Serializers;
import com.fasterxml.jackson.databind.type.ReferenceType;

/**
 * Serializer provider for data object serializer for ({@code DoEntity}, {@code DoValue} and {@code DoList}.
 */
@Bean
public class DataObjectSerializers extends Serializers.Base {

  protected ScoutDataObjectModuleContext m_moduleContext;

  public DataObjectSerializers withModuleContext(ScoutDataObjectModuleContext moduleContext) {
    m_moduleContext = moduleContext;
    return this;
  }

  @Override
  public JsonSerializer<?> findReferenceSerializer(SerializationConfig config, ReferenceType refType, BeanDescription beanDesc, TypeSerializer contentTypeSerializer, JsonSerializer<Object> contentValueSerializer) {
    if (DoValue.class.isAssignableFrom(refType.getRawClass())) {
      boolean staticTyping = (contentTypeSerializer == null) && config.isEnabled(MapperFeature.USE_STATIC_TYPING);
      return new DoValueSerializer(refType, staticTyping, contentTypeSerializer, contentValueSerializer);
    }
    return super.findReferenceSerializer(config, refType, beanDesc, contentTypeSerializer, contentValueSerializer);
  }

  @Override
  public JsonSerializer<?> findSerializer(SerializationConfig config, JavaType type, BeanDescription beanDesc) {
    if (IDoEntity.class.isAssignableFrom(type.getRawClass())) {
      return new DoEntitySerializer(type);
    }
    else if (DoList.class.isAssignableFrom(type.getRawClass())) {
      return new DoListSerializer(type);
    }
    else if (Date.class.isAssignableFrom(type.getRawClass())) {
      return new DoDateSerializer();
    }
    else if (Locale.class.isAssignableFrom(type.getRawClass())) {
      return new DoLocaleSerializer();
    }
    else if (BinaryResource.class.isAssignableFrom(type.getRawClass())) {
      return new DoBinaryResourceSerializer();
    }
    return super.findSerializer(config, type, beanDesc);
  }
}
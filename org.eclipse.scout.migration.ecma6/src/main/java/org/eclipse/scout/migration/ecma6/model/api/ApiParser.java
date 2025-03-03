/*
 * Copyright (c) 2010-2019 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.migration.ecma6.model.api;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Collectors;

import org.eclipse.scout.migration.ecma6.configuration.Configuration;
import org.eclipse.scout.rt.platform.exception.ProcessingException;
import org.eclipse.scout.rt.platform.util.ObjectUtility;

import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class ApiParser {

  private static final ObjectMapper     m_defaultJacksonObjectMapper = new ObjectMapper()
    .setSerializationInclusion(Include.NON_DEFAULT)
    .enable(SerializationFeature.INDENT_OUTPUT)
    .enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
    .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS);


  private Path m_directory;

  public ApiParser(Path directory) {
    m_directory = directory;

  }

  public Libraries parse() throws IOException {
    Libraries allLibs = new Libraries();
    //noinspection resource
    allLibs.addChildren(Files.list(m_directory)
        .sorted(Path::compareTo)
        .map(ApiParser::parseLibrary)
        // do not include current migration source as library
        .filter(lib -> Configuration.get().isParseOnlyIncludeFiles() || ObjectUtility.notEquals(Configuration.get().getPersistLibraryName(), lib.getCustomAttributeString(INamedElement.LIBRARY_MODULE_NAME)))
        .collect(Collectors.toList()));
    allLibs.ensureParents();
    return allLibs;
  }

  protected static NamedElement parseLibrary(Path lib) {
    try {
      return m_defaultJacksonObjectMapper.readValue(Files.newInputStream(lib), NamedElement.class);
    }
    catch (IOException e) {
      throw new ProcessingException("Could parse Api of '" + lib + "'.", e);
    }
  }
}

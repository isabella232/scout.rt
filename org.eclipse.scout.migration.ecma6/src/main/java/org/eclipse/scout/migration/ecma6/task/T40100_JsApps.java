/*
 * Copyright (c) 2010-2020 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.migration.ecma6.task;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.PathMatcher;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import org.eclipse.scout.migration.ecma6.MigrationUtility;
import org.eclipse.scout.migration.ecma6.PathInfo;
import org.eclipse.scout.migration.ecma6.WorkingCopy;
import org.eclipse.scout.migration.ecma6.configuration.Configuration;
import org.eclipse.scout.migration.ecma6.context.AppNameContextProperty;
import org.eclipse.scout.migration.ecma6.context.Context;
import org.eclipse.scout.migration.ecma6.model.old.JsFile;
import org.eclipse.scout.migration.ecma6.model.references.AliasedMember;
import org.eclipse.scout.migration.ecma6.model.references.JsImport;
import org.eclipse.scout.rt.platform.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Order(40100)
public class T40100_JsApps extends AbstractTask {
  private static final Logger LOG = LoggerFactory.getLogger(T40100_JsApps.class);

  private static final PathMatcher MACRO_MATCHER = FileSystems.getDefault().getPathMatcher("glob:src/main/resources/WebContent/res/{index,login,logout,spnego_401,office-addin}.js");
  private static final Map<String /*fqn*/, String /*simpleName*/> APP_NAMES = new HashMap<>();
  static {
    APP_NAMES.put("scout.App", "App");
    APP_NAMES.put("scout.RemoteApp", "RemoteApp");
    APP_NAMES.put("scout.LoginApp", "LoginApp");
    APP_NAMES.put("scout.LogoutApp", "LogoutApp");
  }

  @Override
  public boolean accept(PathInfo pathInfo, Context context) {
    return MACRO_MATCHER.matches(pathInfo.getModuleRelativePath());
  }

  @Override
  public void process(PathInfo pathInfo, Context context) {
    String targetFileName = pathInfo.getPath().getFileName().toString().replaceAll("\\.js\\Z", "");
    if ("index".equalsIgnoreCase(targetFileName)) {
      targetFileName = context.getProperty(AppNameContextProperty.class);
    }
    final WorkingCopy appJsWc = context.ensureWorkingCopy(Configuration.get().getTargetModuleDirectory().resolve(Paths.get("src/main/js", targetFileName + ".js")), true);
    final JsFile appJsFile = context.ensureJsFile(appJsWc, false);

    final WorkingCopy indexWc = context.ensureWorkingCopy(pathInfo.getPath());
    String indexSource = indexWc.getSource();
    // try to find document ready block
    indexSource = indexSource.replaceAll("\\A\\$\\(document\\)\\.ready\\(\\s*function\\(\\s*\\)\\s*\\{\\s*", "");
    indexSource = indexSource.replaceAll("}\\s*\\);[\\r\\n]*\\Z", "");

    // create import for app
    StringBuilder appSourceBuilder = new StringBuilder(appJsWc.getSource());

    Entry<String, String> appMapping = null;
    for (Entry<String, String> e : APP_NAMES.entrySet()) {
      if (indexSource.contains(e.getKey())) {
        appMapping = e;
        break;
      }
    }

    if (appMapping != null) {
      indexSource = indexSource.replace(appMapping.getKey(), appMapping.getValue());
      JsImport imp = appJsFile.getImport("@eclipse-scout/core");
      if (imp == null) {
        imp = new JsImport("@eclipse-scout/core");
        imp.addMember(new AliasedMember(appMapping.getValue()));
        appJsFile.addImport(imp);
      }
      else {
        appSourceBuilder = new StringBuilder(appSourceBuilder.toString().replace("ref1, ", ""));
        imp.setDefaultMember(null);
        imp.addMember(new AliasedMember(appMapping.getValue()));
      }
    }
    else {
      appSourceBuilder.append(MigrationUtility.todoText("Add import for App if necessary")).append(appJsWc.getLineDelimiter());
    }
    if ("office-addin".equalsIgnoreCase(targetFileName)) {
      appSourceBuilder.append(MigrationUtility.todoText("Add imports to all necessary index files (@bsi-scout/officeaddin and more), compare with archetype")).append(appJsWc.getLineDelimiter()).append(appJsWc.getLineDelimiter());
    }
    if (indexSource.contains("modelsUrl:")) {
      appSourceBuilder.append(MigrationUtility.todoText("Remove attribute modelsUrl manually (not needed anymore).")).append(appJsWc.getLineDelimiter());
    }
    appSourceBuilder.append(indexSource);
    appJsWc.setSource(appSourceBuilder.toString());

    // delete index.js
    try {
      Files.delete(pathInfo.getPath());
    }
    catch (IOException e) {
      LOG.warn("Could not delete macro '" + pathInfo.getPath() + "'");
    }
  }

}

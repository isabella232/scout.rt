/*******************************************************************************
 * Copyright (c) 2010-2015 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.rt.client;

import org.eclipse.scout.rt.client.services.common.prefs.FileSystemUserPreferencesStorageService;
import org.eclipse.scout.rt.client.ui.desktop.IDesktop;
import org.eclipse.scout.rt.platform.config.AbstractBooleanConfigProperty;
import org.eclipse.scout.rt.platform.config.AbstractPositiveLongConfigProperty;
import org.eclipse.scout.rt.platform.config.AbstractStringConfigProperty;
import org.eclipse.scout.rt.platform.exception.PlatformException;
import org.eclipse.scout.rt.platform.util.ObjectUtility;

public final class ClientConfigProperties {
  private ClientConfigProperties() {
  }

  /**
   * Specifies how long the client keeps fetched data before it is discarded.<br>
   * Must be one of the following values: small, medium or large. Default is large.
   */
  public static class MemoryPolicyProperty extends AbstractStringConfigProperty {

    @Override
    protected String parse(String value) {
      if (ObjectUtility.isOneOf(value, "small", "medium", "large")) {
        return value;
      }
      throw new PlatformException("Invalid value for property '" + getKey() + "': '" + value + "'. Valid values are small, medium or large");
    }

    @Override
    public String getKey() {
      return "org.eclipse.scout.memory";
    }

    @Override
    protected String getDefaultValue() {
      return "large";
    }
  }

  /**
   * Specifies the user area on the local file system where to store user preferences.<br>
   * If nothing is specified the user home of the operating system is used.
   *
   * @see FileSystemUserPreferencesStorageService
   */
  public static class UserAreaProperty extends AbstractStringConfigProperty {

    @Override
    public String getKey() {
      return "user.area";
    }
  }

  /**
   * Specifies the maximal time (in seconds) to wait until running jobs are cancelled on session shutdown.
   */
  public static class JobCompletionDelayOnSessionShutdown extends AbstractPositiveLongConfigProperty {

    @Override
    public String getKey() {
      return "session.jobCompletionDelayOnSessionShutdown";
    }

    @Override
    protected Long getDefaultValue() {
      return 10L;
    }
  }

  /**
   * Switch to enable or disable support for deferred data changed events (i.e. to restore legacy behavior). <br>
   * Note: this affects only those listeners registered by
   * {@link IDesktop#addDataChangeDesktopInForegroundListener(org.eclipse.scout.rt.client.ui.DataChangeListener, Object...)}
   *
   * @deprecated legacy support will be removed in 9.x release
   */
  @Deprecated
  public static class DefereDataChangeEventsIfDesktopInBackground extends AbstractBooleanConfigProperty {
    @Override
    public String getKey() {
      return "scout.dataChange.defereEventsIfDesktopInBackground";
    }

    @Override
    protected Boolean getDefaultValue() {
      return Boolean.TRUE;
    }
  }
}

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
package org.eclipse.scout.rt.server.services.common.security;

import javax.security.auth.Subject;

import org.eclipse.scout.commons.annotations.Priority;
import org.eclipse.scout.commons.logger.IScoutLogger;
import org.eclipse.scout.commons.logger.ScoutLogManager;
import org.eclipse.scout.rt.server.IServerSession;
import org.eclipse.scout.rt.server.ThreadContext;
import org.eclipse.scout.rt.server.commons.cache.ICacheStoreService;
import org.eclipse.scout.rt.shared.services.common.security.ILogoutService;
import org.eclipse.scout.service.AbstractService;
import org.eclipse.scout.service.SERVICES;

@Priority(-1)
public class LogoutService extends AbstractService implements ILogoutService {
  private static final IScoutLogger LOG = ScoutLogManager.getLogger(LogoutService.class);

  public LogoutService() {
  }

  @Override
  public void logout() {
    SERVICES.getService(ICacheStoreService.class).removeClientAttribute(ThreadContext.getHttpServletRequest(), ThreadContext.getHttpServletResponse(), IServerSession.class.getName());
    SERVICES.getService(ICacheStoreService.class).removeClientAttribute(ThreadContext.getHttpServletRequest(), ThreadContext.getHttpServletResponse(), Subject.class.getName());
  }
}

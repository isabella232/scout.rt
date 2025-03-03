/*******************************************************************************
 * Copyright (c) 2010-2019 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.rt.security;

import java.security.Permission;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.eclipse.scout.rt.platform.util.EnumerationUtility;

/**
 * Default implementation of an permission collection implementing {@link IPermissionCollection}.
 * <p>
 * Unlike other permission collections, this implementation utilize the fact than an {@link IPermission} can only be
 * implied by another {@link IPermission} with the same name.
 */
public class DefaultPermissionCollection extends AbstractPermissionCollection {
  private static final long serialVersionUID = 1L;

  /** content is effective immutable and protected by {@link #isReadOnly()} */
  private final Map<String, List<IPermission>> m_permissions;
  private final List<Permission> m_javaPermissions;

  public DefaultPermissionCollection() {
    m_permissions = new HashMap<>();
    m_javaPermissions = new ArrayList<>();
  }

  @Override
  public void add(Permission permission) {
    assertNotReadOnly();
    if (permission instanceof IPermission) {
      add((IPermission) permission);
    }
    else if (permission != null) {
      m_javaPermissions.add(permission);
    }
  }

  @Override
  public void add(IPermission permission) {
    assertNotReadOnly();
    if (permission != null) {
      m_permissions.computeIfAbsent(permission.getName(), k -> new ArrayList<>()).add(permission);
    }
  }

  @Override
  public void setReadOnly() {
    super.setReadOnly();
    assignPermissionCollectionInternal();
  }

  protected void assignPermissionCollectionInternal() {
    m_permissions.values().stream()
        .flatMap(Collection::stream)
        .forEach(p -> p.assignPermissionCollection(this));
  }

  @Override
  public boolean implies(Permission permission) {
    if (permission == null) {
      return false;
    }
    else if (permission instanceof IPermission) {
      return implies((IPermission) permission);
    }
    else {
      return m_javaPermissions.stream().anyMatch(def -> def.implies(permission));
    }
  }

  @Override
  public boolean implies(IPermission permission) {
    if (permission == null) {
      return false;
    }
    return m_permissions.getOrDefault(permission.getName(), Collections.emptyList()).stream().anyMatch(def -> def.implies(permission));
  }

  @Override
  public PermissionLevel getGrantedPermissionLevel(IPermission permission) {
    if (permission == null) {
      return PermissionLevel.UNDEFINED;
    }

    Set<PermissionLevel> grantedLevels = stream(permission)
        .map(IPermission::getLevel)
        .collect(Collectors.toSet());

    switch (grantedLevels.size()) {
      case 0:
        return PermissionLevel.NONE; // no such permission was granted
      case 1:
        return grantedLevels.iterator().next();
      default:
        return PermissionLevel.UNDEFINED; // there are multiple permissions matching - concrete level depends on a data
    }
  }

  @Override
  public Stream<IPermission> stream() {
    return m_permissions.values().stream().flatMap(Collection::stream);
  }

  @Override
  public Stream<IPermission> stream(IPermission permission) {
    if (permission == null) {
      return Stream.empty();
    }
    return m_permissions.getOrDefault(permission.getName(), Collections.emptyList()).stream()
        .filter(def -> def.matches(permission));
  }

  @Override
  public Enumeration<Permission> elements() {
    return EnumerationUtility.asEnumeration(
        Stream.concat(stream().map(Permission.class::cast), m_javaPermissions.stream()).iterator());
  }
}

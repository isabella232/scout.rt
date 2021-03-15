/*
 * Copyright (c) 2010-2021 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.rt.platform.namespace;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.eclipse.scout.rt.platform.ApplicationScoped;
import org.eclipse.scout.rt.platform.BEANS;
import org.eclipse.scout.rt.platform.internal.BeanInstanceUtil;
import org.eclipse.scout.rt.platform.inventory.ClassInventory;
import org.eclipse.scout.rt.platform.inventory.IClassInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ApplicationScoped
public class Namespaces {

  private static final Logger LOG = LoggerFactory.getLogger(Namespaces.class);

  private final LinkedHashMap<String, INamespace> m_namespaces = new LinkedHashMap<>();

  @PostConstruct
  protected void init() {
    List<INamespace> namespaces = ClassInventory.get().getAllKnownSubClasses(INamespace.class).stream()
        .filter(IClassInfo::isInstanciable)
        .map(classInfo -> (INamespace) BeanInstanceUtil.createBean(classInfo.resolveClass()))
        .sorted(Comparator.comparing(INamespace::getOrder).thenComparing(namespace -> namespace.getClass().getName())) // FQN fallback in case of identical orders
        .collect(Collectors.toList());

    // Validate ID uniqueness
    namespaces.stream()
        .collect(Collectors.groupingBy(INamespace::getId))
        .entrySet()
        .stream()
        .filter(entry -> entry.getValue().size() > 1) // only those IDs with more than one namespace class
        .forEach(entry -> LOG.error("Non-unique namespace detected id={}, values=[{}]", entry.getKey(), entry.getValue().stream().map(namespace -> namespace.getClass().getName()).collect(Collectors.joining(", "))));

    // If there are non-unique IDs, only keep the first namespace
    namespaces.forEach(namespace -> getNamespaces().putIfAbsent(namespace.getId(), namespace));
  }

  public static Namespaces get() {
    return BEANS.get(Namespaces.class);
  }

  protected LinkedHashMap<String, INamespace> getNamespaces() {
    return m_namespaces;
  }

  /**
   * @return All {@link INamespace} sorted by their order.
   */
  public List<INamespace> all() {
    return new ArrayList<>(getNamespaces().values());
  }

  /**
   * @return Namespace with the given id or <code>null</code> if none is found.
   */
  public INamespace byId(String id) {
    return getNamespaces().get(id);
  }
}

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
package org.eclipse.scout.rt.dataobject;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.ListIterator;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.eclipse.scout.rt.dataobject.DoList;
import org.eclipse.scout.rt.dataobject.DoNode;
import org.eclipse.scout.rt.dataobject.DoValue;
import org.eclipse.scout.rt.platform.util.CollectionUtility;
import org.junit.Before;
import org.junit.Test;

/**
 * Various low-level tests for {@link DoList}
 */
public class DoListTest {

  protected DoList<String> m_testDoList;

  @Before
  public void before() {
    m_testDoList = new DoList<>();
    m_testDoList.add("foo");
    m_testDoList.add("bar");
    m_testDoList.add("baz");
  }

  @Test
  public void testDoListConstructor() {
    DoList<String> list = new DoList<>();
    assertTrue(list.exists());
  }

  protected Consumer<DoNode<List<String>>> m_lazyCreate = attribute -> {
    /* nop */ };

  @Test
  public void testCreateExists() {
    DoList<String> list = new DoList<>(null, m_lazyCreate);
    assertFalse(list.exists());
    list.create();
    assertTrue(list.exists());

    list = new DoList<>(null, m_lazyCreate);
    assertFalse(list.exists());
    list.set(Arrays.asList("foo", "bar"));
    assertTrue(list.exists());

    list = new DoList<>(null, m_lazyCreate);
    assertFalse(list.exists());
    list.get();
    assertTrue(list.exists());
  }

  @Test
  public void testOf() {
    DoList<String> list = DoList.of(Arrays.asList("foo", "bar"));
    assertTrue(list.exists());
    assertEquals("foo", list.get(0));
    assertEquals("bar", list.get(1));
  }

  @Test
  public void testOfNull() {
    DoList<String> list = DoList.of(null);
    assertTrue(list.exists());
    assertTrue(list.isEmpty());
    assertEquals(new ArrayList<>(), list.get());
  }

  @Test
  public void testGet() {
    assertEquals(Arrays.asList("foo", "bar", "baz"), m_testDoList.get());
  }

  @Test
  public void testSet() {
    m_testDoList.set(Arrays.asList("foo"));
    assertEquals(Arrays.asList("foo"), m_testDoList.get());

    m_testDoList.set(Collections.emptyList());
    assertEquals(Collections.emptyList(), m_testDoList.get());
    assertTrue(m_testDoList.isEmpty());
    assertNotNull(m_testDoList.get());

    m_testDoList.set(null);
    assertEquals(Collections.emptyList(), m_testDoList.get());
    assertTrue(m_testDoList.isEmpty());
    assertNotNull(m_testDoList.get());
  }

  @Test
  public void testGetByIndex() {
    assertEquals("foo", m_testDoList.get(0));
    assertEquals("bar", m_testDoList.get(1));
    assertEquals("baz", m_testDoList.get(2));
  }

  @Test
  public void testAdd() {
    m_testDoList.add("qux");
    assertEquals("qux", m_testDoList.get(3));

    m_testDoList.add(null);
    assertNull(m_testDoList.get(4));
  }

  @Test
  public void testAddAllCollection() {
    Collection<String> collection = new LinkedHashSet<>();
    collection.add("qux");
    collection.add("quux");
    m_testDoList.addAll(collection);
    assertEquals("qux", m_testDoList.get(3));
    assertEquals("quux", m_testDoList.get(4));
  }

  @Test
  public void testAddAllCollectionNull() {
    Collection<String> collection = null;
    m_testDoList.addAll(collection);
    assertEquals(3, m_testDoList.size());
  }

  @Test
  public void testAddAllArray() {
    m_testDoList.addAll("qux", "quux");
    assertEquals("qux", m_testDoList.get(3));
    assertEquals("quux", m_testDoList.get(4));
  }

  @Test
  public void testAddAllArrayNull() {
    String[] strings = null;
    m_testDoList.addAll(strings);
    assertEquals(3, m_testDoList.size());
  }

  @Test
  public void testRemove() {
    assertTrue(m_testDoList.remove("bar"));
    assertEquals(Arrays.asList("foo", "baz"), m_testDoList.get());

    assertTrue(m_testDoList.remove("foo"));
    assertEquals(Arrays.asList("baz"), m_testDoList.get());

    assertFalse(m_testDoList.remove("bar"));
    assertEquals(Arrays.asList("baz"), m_testDoList.get());

    assertFalse(m_testDoList.remove("notExistingElement"));
    assertEquals(Arrays.asList("baz"), m_testDoList.get());

    assertFalse(m_testDoList.remove(null));
    assertEquals(Arrays.asList("baz"), m_testDoList.get());

    assertTrue(m_testDoList.remove("baz"));
    assertEquals(Arrays.asList(), m_testDoList.get());
  }

  @Test
  public void testRemoveByIndex() {
    String element = m_testDoList.remove(1);
    assertEquals("bar", element);
    assertEquals(Arrays.asList("foo", "baz"), m_testDoList.get());

    element = m_testDoList.remove(0);
    assertEquals("foo", element);
    assertEquals(Arrays.asList("baz"), m_testDoList.get());

    element = m_testDoList.remove(0);
    assertEquals("baz", element);
    assertEquals(Arrays.asList(), m_testDoList.get());
  }

  @Test
  public void testRemoveIntList() {
    DoList<Integer> intList = new DoList<>();
    intList.add(1);
    intList.add(2);
    intList.add(3);
    intList.remove(1);
    assertEquals(Arrays.asList(1, 3), intList.get());
    intList.remove(Integer.valueOf(3));
    assertEquals(Arrays.asList(1), intList.get());
    intList.remove(Integer.valueOf(1));
    assertTrue(intList.isEmpty());
  }

  @Test
  public void testRemoveAllCollection() {
    assertTrue(m_testDoList.removeAll(Arrays.asList("bar")));
    assertEquals(Arrays.asList("foo", "baz"), m_testDoList.get());

    assertTrue(m_testDoList.removeAll(Arrays.asList("baz", "foo")));
    assertEquals(Arrays.asList(), m_testDoList.get());

    assertFalse(m_testDoList.removeAll(Arrays.asList("abc", "def")));
    assertEquals(Arrays.asList(), m_testDoList.get());
  }

  @Test
  public void testRemoveAllWildcardCollection() {
    // text removeAll using "Collection<? extends String>"
    m_testDoList.clear();
    m_testDoList.add("foo");
    assertEquals(Arrays.asList("foo"), m_testDoList.get());
    Collection<? extends String> elementsToRemove = new ArrayList<>(Arrays.asList("foo"));
    m_testDoList.removeAll(elementsToRemove);
    assertEquals(Arrays.asList(), m_testDoList.get());
  }

  @Test
  public void testRemoveAllCollectionNull() {
    Collection<String> collection = null;
    assertFalse(m_testDoList.removeAll(collection));
    assertEquals(3, m_testDoList.size());
  }

  @Test
  public void testRemoveAllArray() {
    assertTrue(m_testDoList.removeAll("bar"));
    assertEquals(Arrays.asList("foo", "baz"), m_testDoList.get());

    assertTrue(m_testDoList.removeAll("baz", "foo"));
    assertEquals(Arrays.asList(), m_testDoList.get());

    assertFalse(m_testDoList.removeAll("abc", "def"));
    assertEquals(Arrays.asList(), m_testDoList.get());
  }

  @Test
  public void testRemoveAllArrayNull() {
    String[] strings = null;
    assertFalse(m_testDoList.removeAll(strings));
    assertEquals(3, m_testDoList.size());
  }

  @Test
  public void testUpdateAllCollection() {
    m_testDoList.updateAll(Arrays.asList("a", "b"));
    assertEquals(Arrays.asList("a", "b"), m_testDoList.get());

    m_testDoList.updateAll(Collections.emptyList());
    assertEquals(Arrays.asList(), m_testDoList.get());
    assertTrue(m_testDoList.isEmpty());

    m_testDoList.updateAll(Arrays.asList("a", "b"));
    m_testDoList.updateAll((Collection<String>) null);
    assertEquals(Arrays.asList(), m_testDoList.get());
    assertTrue(m_testDoList.isEmpty());

    Collection<? extends String> newValues = new ArrayList<>(Arrays.asList("foo"));
    m_testDoList.updateAll(newValues);
    assertEquals(Arrays.asList("foo"), m_testDoList.get());
  }

  @Test
  public void testUpdateAllArray() {
    m_testDoList.updateAll("a", "b");
    assertEquals(Arrays.asList("a", "b"), m_testDoList.get());

    m_testDoList.updateAll(Collections.emptyList());
    assertEquals(Arrays.asList(), m_testDoList.get());
    assertTrue(m_testDoList.isEmpty());

    m_testDoList.updateAll("a", "b");
    m_testDoList.updateAll((String[]) null);
    assertEquals(Arrays.asList(), m_testDoList.get());
    assertTrue(m_testDoList.isEmpty());
  }

  @Test
  public void testClear() {
    assertEquals(3, m_testDoList.size());
    m_testDoList.clear();
    assertEquals(0, m_testDoList.size());
    m_testDoList.clear();
    assertEquals(0, m_testDoList.size());
  }

  @Test
  public void testFirst() {
    assertEquals("foo", m_testDoList.first());
    m_testDoList.remove("foo");
    assertEquals("bar", m_testDoList.first());
    m_testDoList.clear();
    assertNull(m_testDoList.first());
  }

  @Test
  public void testLast() {
    assertEquals("baz", m_testDoList.last());
    m_testDoList.remove("baz");
    assertEquals("bar", m_testDoList.last());
    m_testDoList.clear();
    assertNull(m_testDoList.last());
  }

  @Test
  public void testSize() {
    assertEquals(3, m_testDoList.size());
    m_testDoList.add("foo");
    assertEquals(4, m_testDoList.size());
    m_testDoList.clear();
    assertEquals(0, m_testDoList.size());
  }

  @Test
  public void testIsEmpty() {
    assertFalse(m_testDoList.isEmpty());
    m_testDoList.clear();
    assertTrue(m_testDoList.isEmpty());
  }

  @Test
  public void testIterator() {
    Iterator<String> iter = m_testDoList.iterator();
    assertTrue(iter.hasNext());
    assertEquals("foo", iter.next());
    assertTrue(iter.hasNext());
    assertEquals("bar", iter.next());
    assertTrue(iter.hasNext());
    assertEquals("baz", iter.next());
    assertFalse(iter.hasNext());
  }

  @Test
  public void testIterable() {
    List<String> actual = new ArrayList<>();
    for (String element : m_testDoList) {
      actual.add(element);
    }
    assertEquals(Arrays.asList("foo", "bar", "baz"), actual);
  }

  @Test
  public void testListIterator() {
    ListIterator<String> iter = m_testDoList.listIterator();
    assertFalse(iter.hasPrevious());
    assertTrue(iter.hasNext());
    assertEquals("foo", iter.next());

    assertTrue(iter.hasPrevious());
    assertTrue(iter.hasNext());
    assertEquals("bar", iter.next());

    assertTrue(iter.hasPrevious());
    assertTrue(iter.hasNext());
    assertEquals("baz", iter.next());

    assertFalse(iter.hasNext());
    assertTrue(iter.hasPrevious());
    iter.previous(); // move one back
    assertEquals("bar", iter.previous());

    assertTrue(iter.hasPrevious());
    assertTrue(iter.hasNext());
    assertEquals("foo", iter.previous());
  }

  @Test
  public void testStream() {
    assertEquals("foo", m_testDoList.stream().findFirst().get());
    assertEquals("foo", m_testDoList.stream().findAny().get());

    assertEquals(Arrays.asList("foo", "bar", "baz"), m_testDoList.stream().collect(Collectors.toList()));
  }

  @Test
  public void testParallelStream() {
    CollectionUtility.equalsCollection(Arrays.asList("foo", "bar", "baz"), m_testDoList.parallelStream().collect(Collectors.toSet()), false);
  }

  @Test
  public void testSort() {
    m_testDoList.sort((left, right) -> left.compareTo(right));
    assertEquals(Arrays.asList("bar", "baz", "foo"), m_testDoList.get());

    m_testDoList.sort((left, right) -> right.compareTo(left));
    assertEquals(Arrays.asList("foo", "baz", "bar"), m_testDoList.get());
  }

  protected Function<String, DoValue<String>> listValueAccessor = new Function<String, DoValue<String>>() {
    @Override
    public DoValue<String> apply(String input) {
      for (String item : m_testDoList.get()) {
        if (item.equals(input)) {
          return DoValue.of(input);
        }
      }
      return null;
    }
  };

  @Test
  public void testFindFirstFunction() {
    assertEquals("bar", m_testDoList.findFirst(listValueAccessor, "bar"));
  }

  @Test
  public void testFindPredicateOfV() {
    assertEquals(Arrays.asList("bar"), m_testDoList.find(listValueAccessor, "bar"));
  }

  @Test
  public void testFindFirst() {
    assertEquals("bar", m_testDoList.findFirst((input) -> input.equals("bar")));
    assertEquals(null, m_testDoList.findFirst((input) -> input.equals("myCustomSearchTerm")));
  }

  @Test
  public void testFind() {
    assertEquals(Arrays.asList("bar"), m_testDoList.find((input) -> input.equals("bar")));
    assertEquals(Arrays.asList("bar", "baz"), m_testDoList.find((input) -> input.equals("bar") || input.equals("baz")));
  }

  @Test
  public void testAttributeName() {
    assertNull(new DoList<>().getAttributeName());
    assertNull(DoList.of(Collections.emptyList()).getAttributeName());
    assertEquals("foo", new DoList<>("foo", null).getAttributeName());
  }

  @Test
  public void testEqualsHashCode() {
    DoList<String> list1 = new DoList<>();
    list1.add("foo");

    DoList<String> list2 = new DoList<>();
    list2.add("foo");

    assertEquals(list1, list2);
    assertEquals(list2, list1);
    assertEquals(list1, list1);
    assertEquals(list1.hashCode(), list2.hashCode());

    list1.add("bar");
    assertNotEquals(list1, list2);

    list2.add("bar");
    assertEquals(list1, list2);
    assertEquals(list1.hashCode(), list2.hashCode());

    assertFalse(list1.equals(null));
    assertFalse(list1.equals(new Object()));
  }
}

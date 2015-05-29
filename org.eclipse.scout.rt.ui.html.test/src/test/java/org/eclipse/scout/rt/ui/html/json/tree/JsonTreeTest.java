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
package org.eclipse.scout.rt.ui.html.json.tree;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;

import org.eclipse.scout.commons.exception.ProcessingException;
import org.eclipse.scout.rt.client.testenvironment.TestEnvironmentClientSession;
import org.eclipse.scout.rt.client.ui.basic.tree.ITree;
import org.eclipse.scout.rt.client.ui.basic.tree.ITreeNode;
import org.eclipse.scout.rt.client.ui.basic.tree.ITreeNodeFilter;
import org.eclipse.scout.rt.client.ui.basic.tree.ITreeVisitor;
import org.eclipse.scout.rt.client.ui.basic.tree.TreeEvent;
import org.eclipse.scout.rt.testing.client.runner.ClientTestRunner;
import org.eclipse.scout.rt.testing.client.runner.RunWithClientSession;
import org.eclipse.scout.rt.testing.platform.runner.RunWithSubject;
import org.eclipse.scout.rt.ui.html.json.IJsonAdapter;
import org.eclipse.scout.rt.ui.html.json.JsonEvent;
import org.eclipse.scout.rt.ui.html.json.fixtures.UiSessionMock;
import org.eclipse.scout.rt.ui.html.json.menu.IJsonContextMenuOwner;
import org.eclipse.scout.rt.ui.html.json.menu.fixtures.Menu;
import org.eclipse.scout.rt.ui.html.json.testing.JsonTestUtility;
import org.eclipse.scout.rt.ui.html.json.tree.fixtures.Tree;
import org.eclipse.scout.rt.ui.html.json.tree.fixtures.TreeNode;
import org.eclipse.scout.rt.ui.html.json.tree.fixtures.TreeWith3Levels;
import org.eclipse.scout.rt.ui.html.json.tree.fixtures.TreeWithOneNode;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(ClientTestRunner.class)
@RunWithSubject("default")
@RunWithClientSession(TestEnvironmentClientSession.class)
public class JsonTreeTest {
  private UiSessionMock m_uiSession;

  @Before
  public void setUp() {
    m_uiSession = new UiSessionMock();
  }

  /**
   * Tests whether the model node gets correctly selected
   */
  @Test
  public void testSelectionEvent() throws ProcessingException, JSONException {
    ITree tree = createTreeWithOneNode();
    ITreeNode node = tree.getRootNode().getChildNode(0);
    assertFalse(node.isSelectedNode());

    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);

    JsonEvent event = createJsonSelectedEvent(jsonTree.getOrCreateNodeId(node));
    jsonTree.handleUiEvent(event);

    assertTrue(node.isSelectedNode());
  }

  /**
   * Response must not contain the selection event if the selection was triggered by the request
   */
  @Test
  public void testIgnorableSelectionEvent() throws ProcessingException, JSONException {
    ITree tree = createTreeWithOneNode();
    ITreeNode node = tree.getRootNode().getChildNode(0);

    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);

    JsonEvent event = createJsonSelectedEvent(jsonTree.getOrCreateNodeId(node));
    jsonTree.handleUiEvent(event);

    List<JsonEvent> responseEvents = JsonTestUtility.extractEventsFromResponse(
        m_uiSession.currentJsonResponse(), JsonTree.EVENT_NODES_SELECTED);
    assertTrue(responseEvents.size() == 0);
  }

  /**
   * If the selection event triggers the selection of another node, the selection event must not be ignored.
   */
  //FIXME CGU Test fails due to scout model bug: selectNode puts first selection event AFTER this new selection event -> gets filtered in processEventBuffers. With table it works though.
//  @Test
//  public void testIgnorableSelectionEvent2() throws ProcessingException, JSONException {
//    List<ITreeNode> nodes = new LinkedList<>();
//    final TreeNode firstNode = new TreeNode();
//    final TreeNode secondNode = new TreeNode();
//
//    nodes.add(firstNode);
//    nodes.add(secondNode);
//    ITree tree = createTree(nodes) {
//
//      @Override
//      protected void execNodesSelected(TreeEvent e) throws ProcessingException {
//        if (e.getNode().equals(secondNode)) {
//          selectNode(firstNode);
//        }
//      }
//    };
//
//    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);
//    JsonEvent event = createJsonSelectedEvent(jsonTree.getOrCreateNodeId(secondNode));
//
//    assertFalse(firstNode.isSelectedNode());
//    assertFalse(secondNode.isSelectedNode());
//
//    jsonTree.handleUiEvent(event, new JsonResponse());
//
//    assertTrue(firstNode.isSelectedNode());
//    assertFalse(secondNode.isSelectedNode());
//
//    List<JsonEvent> responseEvents = JsonTestUtility.extractEventsFromResponse(
//        m_uiSession.currentJsonResponse(), JsonTree.EVENT_NODES_SELECTED);
//    assertTrue(responseEvents.size() == 1);
//
//    List<ITreeNode> treeNodes = jsonTree.extractTreeNodes(responseEvents.get(0).getData());
//    assertEquals(firstNode, treeNodes.get(0));
//  }

  /**
   * Response must not contain the expansion event if the expansion was triggered by the request
   */
  @Test
  public void testIgnorableExpansionEvent() throws ProcessingException, JSONException {
    ITree tree = createTreeWithOneNode();
    ITreeNode node = tree.getRootNode().getChildNode(0);

    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);

    //Check expanded = true
    JsonEvent event = createJsonExpansionEvent(jsonTree.getOrCreateNodeId(node), true);
    jsonTree.handleUiEvent(event);

    List<JsonEvent> responseEvents = JsonTestUtility.extractEventsFromResponse(
        m_uiSession.currentJsonResponse(), JsonTree.EVENT_NODE_EXPANDED);
    assertTrue(responseEvents.size() == 0);

    //Check expanded = false
    event = createJsonExpansionEvent(jsonTree.getOrCreateNodeId(node), false);
    jsonTree.handleUiEvent(event);

    responseEvents = JsonTestUtility.extractEventsFromResponse(
        m_uiSession.currentJsonResponse(), JsonTree.EVENT_NODE_EXPANDED);
    assertTrue(responseEvents.size() == 0);
  }

  @Test
  public void testDispose() throws ProcessingException {
    ITree tree = new TreeWith3Levels();
    tree.initTree();
    JsonTree<ITree> object = m_uiSession.newJsonAdapter(tree, null);
    WeakReference<JsonTree> ref = new WeakReference<JsonTree>(object);

    object.dispose();
    m_uiSession = null;
    object = null;
    JsonTestUtility.assertGC(ref);
  }

  @Test
  public void testMenuDisposalOnPropertyChange() throws ProcessingException, JSONException {
    ITree tree = createTreeWithOneNode();
    ITreeNode node = tree.getRootNode().getChildNode(0);
    assertFalse(node.isSelectedNode());

    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);
    IJsonAdapter<?> contextMenu = jsonTree.getAdapter(tree.getContextMenu());

    Menu menu1 = new Menu();
    tree.getContextMenu().addChildAction(menu1);
    assertNotNull(contextMenu.getAdapter(menu1));
    assertTrue(contextMenu.getAdapter(menu1).isInitialized());

    tree.getContextMenu().removeChildAction(menu1);
    assertNull(contextMenu.getAdapter(menu1));
  }

  @Test
  public void testMultipleMenuDisposallOnPropertyChange() throws ProcessingException, JSONException {
    ITree tree = createTreeWithOneNode();
    ITreeNode node = tree.getRootNode().getChildNode(0);
    assertFalse(node.isSelectedNode());

    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);
    IJsonAdapter<?> contextMenu = jsonTree.getAdapter(tree.getContextMenu());

    Menu menu1 = new Menu();
    Menu menu2 = new Menu();
    tree.getContextMenu().addChildAction(menu1);
    tree.getContextMenu().addChildAction(menu2);
    assertNotNull(contextMenu.getAdapter(menu1));
    assertTrue(contextMenu.getAdapter(menu1).isInitialized());
    assertNotNull(contextMenu.getAdapter(menu2));
    assertTrue(contextMenu.getAdapter(menu2).isInitialized());

    tree.getContextMenu().removeChildAction(menu1);
    assertNull(contextMenu.getAdapter(menu1));
    assertNotNull(contextMenu.getAdapter(menu2));
    assertTrue(contextMenu.getAdapter(menu2).isInitialized());
  }

  /**
   * Tests whether a menus property change event gets sent for the json tree if the context menu changes
   */
  @Test
  public void testMenusChangedEvent() throws ProcessingException, JSONException {
    ITree tree = createTreeWithOneNode();
    ITreeNode node = tree.getRootNode().getChildNode(0);
    assertFalse(node.isSelectedNode());

    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);
    IJsonAdapter<?> contextMenu = jsonTree.getAdapter(tree.getContextMenu());

    Menu menu1 = new Menu();
    tree.getContextMenu().addChildAction(menu1);
    IJsonAdapter<?> jsonMenu1 = contextMenu.getAdapter(menu1);
    assertNotNull(jsonMenu1);
    assertTrue(jsonMenu1.isInitialized());

    JSONArray jsonMenus = JsonTestUtility.extractProperty(
        m_uiSession.currentJsonResponse(), jsonTree.getId(), IJsonContextMenuOwner.PROP_MENUS);

    assertNotNull(jsonMenus);
    assertEquals(1, jsonMenus.length());
    assertEquals(jsonMenu1.getId(), jsonMenus.get(0));
  }

  /**
   * Tests whether a deletion event with correct node id gets sent whenever a node gets deleted.
   */
  @Test
  public void testNodesDeletedEvent() throws ProcessingException, JSONException {
    List<ITreeNode> nodes = new ArrayList<ITreeNode>();
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    ITree tree = createTree(nodes);
    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);

    String node1Id = jsonTree.getOrCreateNodeId(nodes.get(1));
    tree.removeNode(nodes.get(1));

    List<JsonEvent> responseEvents = JsonTestUtility.extractEventsFromResponse(
        m_uiSession.currentJsonResponse(), JsonTree.EVENT_NODES_DELETED);
    assertTrue(responseEvents.size() == 1);

    JsonEvent event = responseEvents.get(0);
    JSONArray nodeIds = event.getData().getJSONArray("nodeIds");

    assertTrue(nodeIds.length() == 1);
    assertTrue(nodeIds.get(0).equals(node1Id));
  }

  /**
   * Tests whether the node gets removed from the maps after deletion (m_treeNodes, m_treeNodeIds)
   */
  @Test
  public void testNodeDisposal() throws ProcessingException, JSONException {
    List<ITreeNode> nodes = new ArrayList<ITreeNode>();
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    ITree tree = createTree(nodes);
    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);

    String node0Id = jsonTree.getOrCreateNodeId(nodes.get(0));
    assertNotNull(node0Id);
    assertNotNull(jsonTree.getNode(node0Id));

    tree.removeNode(nodes.get(0));

    JsonTestUtility.processBufferedEvents(m_uiSession);
    assertNull(jsonTree.getNodeId(nodes.get(0)));
    assertNull(jsonTree.getNode(node0Id));
  }

  @Test
  public void testNodeFilter() throws ProcessingException, JSONException {
    TreeNode nodeToFilter = new TreeNode();
    nodeToFilter.setEnabled(false);
    List<ITreeNode> nodes = new ArrayList<ITreeNode>();
    nodes.add(nodeToFilter);
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    ITree tree = createTree(nodes);
    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);

    String node0Id = jsonTree.getOrCreateNodeId(nodes.get(0));
    assertNotNull(node0Id);
    assertNotNull(jsonTree.getNode(node0Id));

    tree.addNodeFilter(new ITreeNodeFilter() {

      @Override
      public boolean accept(ITreeNode node, int level) {
        return node.isEnabled();
      }
    });

    JsonTestUtility.processBufferedEvents(m_uiSession);
    assertNull(jsonTree.getNodeId(nodes.get(0)));
    assertNull(jsonTree.getNode(node0Id));
  }

  /**
   * Tests whether the child nodes gets removed from the maps after deletion (m_treeNodes, m_treeNodeIds)
   */
  @Test
  public void testNodeDisposalRec() throws ProcessingException, JSONException {
    ITree tree = new TreeWith3Levels();
    tree.initTree();

    List<ITreeNode> allNodes = getAllTreeNodes(tree);
    List<String> allNodeIds = new LinkedList<String>();

    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);

    for (ITreeNode node : allNodes) {
      String nodeId = jsonTree.getOrCreateNodeId(node);
      allNodeIds.add(nodeId);

      assertNotNull(nodeId);
      assertNotNull(jsonTree.getNode(nodeId));
    }

    tree.removeNode(allNodes.get(0));

    JsonTestUtility.processBufferedEvents(m_uiSession);
    for (ITreeNode node : allNodes) {
      assertNull(jsonTree.getNodeId(node));
    }
    for (String nodeId : allNodeIds) {
      assertNull(jsonTree.getNode(nodeId));
    }
  }

  /**
   * Tests whether an all nodes deleted event gets sent whenever all children of a node get deleted.
   */
  @Test
  public void testAllNodesDeletedEvent() throws ProcessingException, JSONException {
    List<ITreeNode> nodes = new ArrayList<ITreeNode>();
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    ITree tree = createTree(nodes);
    m_uiSession.createJsonAdapter(tree, null);

    tree.removeChildNodes(tree.getRootNode(), tree.getRootNode().getChildNodes());

    List<JsonEvent> responseEvents = JsonTestUtility.extractEventsFromResponse(
        m_uiSession.currentJsonResponse(), JsonTree.EVENT_ALL_NODES_DELETED);
    JsonEvent event = responseEvents.get(0);
    assertNull(event.getData().optJSONArray("nodeIds"));
  }

  /**
   * GetOrCreateNodeId must not create a nodeId if null is passed (may happen if someone calls getSelectedNode which may
   * return null).
   */
  @Test
  public void testGetOrCreateNodeIdWithNull() throws ProcessingException, JSONException {
    ITree tree = createTreeWithOneNode();
    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);
    Assert.assertNull(jsonTree.getOrCreateNodeId(null));
  }

  @Test
  public void testTreeExpandedRecursive() throws Exception {
    // (root)
    //   +-(node)
    //   |   +-(node)
    //   |   |   +-(node)
    //   |   |   +-(node)
    //   |   +-(node)
    //   +-(node)
    //   |   +-(node)
    //   +-(node)
    List<ITreeNode> nodes = new ArrayList<ITreeNode>();
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    ITree tree = createTree(nodes);
    tree.addChildNode(tree.getRootNode().getChildNode(0), new TreeNode());
    tree.addChildNode(tree.getRootNode().getChildNode(0), new TreeNode());
    tree.addChildNode(tree.getRootNode().getChildNode(0).getChildNode(0), new TreeNode());
    tree.addChildNode(tree.getRootNode().getChildNode(0).getChildNode(0), new TreeNode());
    tree.addChildNode(tree.getRootNode().getChildNode(1), new TreeNode());

    IJsonAdapter<? super ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);
    m_uiSession.currentJsonResponse().addAdapter(jsonTree);
    JSONObject response = m_uiSession.currentJsonResponse().toJson();
    System.out.println("Response #1: " + response);
    JsonTestUtility.endRequest(m_uiSession);

    // --------------------------------------

    tree.expandAll(tree.getRootNode());
    response = m_uiSession.currentJsonResponse().toJson();
    System.out.println("Response #2: " + response);

    List<JsonEvent> events = m_uiSession.currentJsonResponse().getEventList();
    assertEquals(3, events.size());
    assertEquals("nodeExpanded", events.get(0).getType());
    assertEquals(true, events.get(0).getData().optBoolean("expanded"));
    assertEquals(true, events.get(0).getData().optBoolean("recursive"));
    assertEquals("nodeExpanded", events.get(1).getType());
    assertEquals(true, events.get(1).getData().optBoolean("expanded"));
    assertEquals(true, events.get(1).getData().optBoolean("recursive"));
    assertEquals("nodeExpanded", events.get(2).getType());
    assertEquals(true, events.get(2).getData().optBoolean("expanded"));
    assertEquals(true, events.get(2).getData().optBoolean("recursive"));

    JsonTestUtility.endRequest(m_uiSession);

    // --------------------------------------

    tree.collapseAll(tree.getRootNode().getChildNode(0));
    response = m_uiSession.currentJsonResponse().toJson();
    System.out.println("Response #3: " + response);

    events = m_uiSession.currentJsonResponse().getEventList();
    assertEquals(1, events.size());
    assertEquals("nodeExpanded", events.get(0).getType());
    assertEquals(false, events.get(0).getData().optBoolean("expanded"));
    assertEquals(true, events.get(0).getData().optBoolean("recursive"));
  }

  @Test
  public void testMultipleFilterChanged() throws Exception {
    // (root)
    //   +-(node)
    //   |   +-(node)
    //   |   |   +-(node)
    //   |   |   +-(node)
    //   |   +-(node)
    //   +-(node)
    //   |   +-(node)
    //   +-(node)
    List<ITreeNode> nodes = new ArrayList<ITreeNode>();
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    ITree tree = createTree(nodes);
    tree.addChildNode(tree.getRootNode().getChildNode(0), new TreeNode());
    tree.addChildNode(tree.getRootNode().getChildNode(0), new TreeNode());
    tree.addChildNode(tree.getRootNode().getChildNode(0).getChildNode(0), new TreeNode());
    tree.addChildNode(tree.getRootNode().getChildNode(0).getChildNode(0), new TreeNode());
    tree.addChildNode(tree.getRootNode().getChildNode(1), new TreeNode());

    IJsonAdapter<? super ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);
    m_uiSession.currentJsonResponse().addAdapter(jsonTree);
    JSONObject response = m_uiSession.currentJsonResponse().toJson();
    System.out.println("Response #1: " + response);
    JsonTestUtility.endRequest(m_uiSession);

    // --------------------------------------

    // 3 events: filterChanged, nodeChanged, filterChanged
    // filterChanged events are converted to allNodesDeleted + nodesInserted + nodesSelected events in JsonTree. Because of coalesce,
    // the nodeChanged event will be removed (it is obsolete, because nodes are deleted and re-inserted later).
    tree.applyNodeFilters();
    tree.getRootNode().getChildNode(0).getChildNode(0).getCellForUpdate().setText("Test-Text");
    tree.applyNodeFilters();

    response = m_uiSession.currentJsonResponse().toJson();
    System.out.println("Response #2: " + response);

    List<JsonEvent> events = m_uiSession.currentJsonResponse().getEventList();
    assertEquals(3, events.size());
    assertEquals("allNodesDeleted", events.get(0).getType());
    assertEquals("nodesInserted", events.get(1).getType());
    assertEquals("nodesSelected", events.get(2).getType());
  }

  /**
   * Tests that events are ignored when nodes are not yet inserted.
   */
  @Test
  public void testWrongEventOrder() throws ProcessingException, JSONException {
    List<ITreeNode> nodes = new ArrayList<ITreeNode>();
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    nodes.add(new TreeNode());
    ITree tree = createTree(nodes);
    JsonTree<ITree> jsonTree = m_uiSession.createJsonAdapter(tree, null);

    TreeNode newNode = new TreeNode();
    jsonTree.handleModelTreeEvent(new TreeEvent(tree, TreeEvent.TYPE_NODE_EXPANDED, newNode));
    jsonTree.handleModelTreeEvent(new TreeEvent(tree, TreeEvent.TYPE_NODES_INSERTED, nodes.get(0), Collections.singletonList(newNode)));

    JsonTestUtility.processBufferedEvents(m_uiSession);
    List<JsonEvent> events = m_uiSession.currentJsonResponse().getEventList();
    assertEquals(1, events.size());
    assertEquals("nodesInserted", events.get(0).getType());
  }

  public static JsonEvent createJsonSelectedEvent(String nodeId) throws JSONException {
    String desktopId = "x"; // never used
    JSONObject data = new JSONObject();
    JSONArray nodeIds = new JSONArray();
    nodeIds.put(nodeId);
    data.put(JsonTree.PROP_NODE_IDS, nodeIds);
    return new JsonEvent(desktopId, JsonTree.EVENT_NODES_SELECTED, data);
  }

  public static JsonEvent createJsonExpansionEvent(String nodeId, boolean expanded) throws JSONException {
    JSONObject data = new JSONObject();
    data.put(JsonTree.PROP_NODE_ID, nodeId);
    data.put("expanded", expanded);
    return new JsonEvent("", JsonTree.EVENT_NODE_EXPANDED, data);
  }

  protected TreeWithOneNode createTreeWithOneNode() throws ProcessingException {
    TreeWithOneNode tree = new TreeWithOneNode();
    tree.initTree();
    return tree;
  }

  protected Tree createTree(List<ITreeNode> nodes) throws ProcessingException {
    Tree tree = new Tree(nodes);
    tree.initTree();
    return tree;
  }

  public static String getOrCreateNodeId(JsonTree tree, ITreeNode node) {
    return tree.getOrCreateNodeId(node);
  }

  public static String getNodeId(JsonTree tree, ITreeNode node) {
    return tree.getNodeId(node);
  }

  public static ITreeNode getNode(JsonTree tree, String nodeId) {
    return tree.getNode(nodeId);
  }

  public static List<ITreeNode> getAllTreeNodes(final ITree tree) {
    final List<ITreeNode> nodes = new LinkedList<ITreeNode>();
    tree.visitTree(new ITreeVisitor() {

      @Override
      public boolean visit(ITreeNode node) {
        if (!tree.isRootNodeVisible() && tree.getRootNode() == node) {
          return true;
        }
        nodes.add(node);
        return true;
      }
    });
    return nodes;
  }
}

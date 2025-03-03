/*
 * Copyright (c) 2014-2018 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
import {
  arrays,
  defaultValues,
  DetailTableTreeFilter,
  Device,
  FileChooserController,
  Form,
  GroupBoxMenuItemsOrder,
  HtmlComponent,
  keyStrokeModifier,
  MenuBar,
  menus as menus_1,
  MessageBoxController,
  NavigateButton,
  NavigateDownButton,
  NavigateUpButton,
  OutlineKeyStrokeContext,
  OutlineLayout,
  OutlineNavigateToTopKeyStroke,
  Page,
  PageLayout,
  scout,
  TableControlAdapterMenu,
  TableRow,
  TableRowDetail,
  Tree,
  TreeCollapseOrDrillUpKeyStroke,
  TreeExpandOrDrillDownKeyStroke,
  TreeNavigationDownKeyStroke,
  TreeNavigationEndKeyStroke,
  TreeNavigationUpKeyStroke
} from '../../index';
import $ from 'jquery';

/**
 * @extends {Tree}
 * @class
 * @constructor
 */
export default class Outline extends Tree {

  constructor() {
    super();

    this.compact = false;
    this.defaultDetailForm = null;
    this.embedDetailContent = false;
    this.inBackground = false;
    this.mediator = null;
    this.navigateButtonsVisible = true;
    this.navigateUpInProgress = false; // see NavigateUpButton.js
    this.outlineOverview = null;
    this.outlineOverviewVisible = true;
    this.toggleBreadcrumbStyleEnabled = true;
    this.titleVisible = true;

    this.menus = [];
    this.titleMenuBar = null;
    this.nodeMenuBar = null;
    this.nodeMenuBarVisible = false;
    this.detailMenuBar = null;
    this.detailMenuBarVisible = false;

    this.dialogs = [];
    this.views = [];
    this.messageBoxes = [];
    this.fileChoosers = [];
    this.formController = null;
    this.messageBoxController = null;
    this.fileChooserController = null;

    this._detailContentDestroyHandler = this._onDetailContentDestroy.bind(this);
    this._detailMenusNodesSelectedHandler = null;
    this._additionalContainerClasses += ' outline';
    this.nodePaddingLevelCheckable = 20; /* outline is not checkable. set to same value as not-checkable */
    this.nodePaddingLevelNotCheckable = 20; /* outline uses different level-paddings that normal trees */
    this._scrolldirections = 'y';
    this._addWidgetProperties(['defaultDetailForm', 'views', 'selectedViewTabs', 'dialogs', 'messageBoxes', 'fileChoosers']);
  }

  _init(model) {
    // add filter before first traversal of tree -> tree is only traversed once.
    this.addFilter(new DetailTableTreeFilter(), true);
    super._init(model);

    this.mediator = this._createMediator();
    this.formController = scout.create('FormController', {
      displayParent: this,
      session: this.session
    });
    this.messageBoxController = new MessageBoxController(this, this.session);
    this.fileChooserController = new FileChooserController(this, this.session);
    this.resolveTextKeys(['title']);

    // menu bars
    this.titleMenuBar = scout.create('MenuBar', {
      parent: this,
      menuOrder: new GroupBoxMenuItemsOrder()
    });
    this.nodeMenuBar = scout.create('MenuBar', {
      parent: this,
      position: MenuBar.Position.BOTTOM,
      menuOrder: new GroupBoxMenuItemsOrder()
    });
    this.detailMenuBar = scout.create('MenuBar', {
      parent: this,
      position: MenuBar.Position.BOTTOM,
      menuOrder: new GroupBoxMenuItemsOrder()
    });

    this._setDefaultDetailForm(this.defaultDetailForm);
    this._setOutlineOverviewVisible(this.outlineOverviewVisible);
    this._setOutlineOverview(this.outlineOverview);
    this._updateOutlineOverview();

    this._setViews(this.views);
    this._setMenus(this.menus);
    this.updateDetailContent();
  }

  /**
   * This function returns the outline mediator instance. When we're in an online Scout application we must
   * return a null instance here, because mediation is done server-side.
   */
  _createMediator() {
    return scout.create('OutlineMediator');
  }

  /**
   * @override Tree.js
   */
  _createTreeNode(nodeModel) {
    var model = $.extend({
      objectType: 'Page'
    }, nodeModel);
    return this._createChild(model);
  }

  _applyNodeDefaultValues(node) {
    defaultValues.applyTo(node, 'Page');
  }

  _createKeyStrokeContext() {
    return new OutlineKeyStrokeContext(this);
  }

  _filterMenus(menus, destination, onlyVisible, enableDisableKeyStroke) {
    // show no contextmenues
    return [];
  }

  /**
   * @override Tree.js
   */
  _initTreeKeyStrokeContext() {
    var modifierBitMask = keyStrokeModifier.CTRL | keyStrokeModifier.SHIFT; // NOSONAR

    this.keyStrokeContext.registerKeyStroke([
      new TreeNavigationUpKeyStroke(this, modifierBitMask),
      new TreeNavigationDownKeyStroke(this, modifierBitMask),
      new OutlineNavigateToTopKeyStroke(this, modifierBitMask),
      new TreeNavigationEndKeyStroke(this, modifierBitMask),
      new TreeCollapseOrDrillUpKeyStroke(this, modifierBitMask),
      new TreeExpandOrDrillDownKeyStroke(this, modifierBitMask)
    ]);

    this.keyStrokeContext.$bindTarget = function() {
      return this.session.$entryPoint;
    }.bind(this);
  }

  /**
   * @override
   */
  _render() {
    super._render();

    // Override layout
    this.htmlComp.setLayout(new OutlineLayout(this));
    this._renderCompact();
    this._renderEmbedDetailContent();
    this._renderDetailContent();
    this._renderDetailMenuBarVisible();
    this._renderNodeMenuBarVisible();
  }

  _renderProperties() {
    super._renderProperties();
    this._renderTitle();
    this._updateIcon();
    this._renderTitleMenuBar();
  }

  /**
   * @override Tree.js
   */
  _computeNodePaddingLeft(node) {
    this._computeNodePaddings();

    if (this.compact) {
      if (node.row && node.getOutline().selectedNode() !== node) {
        return node.row._hierarchyLevel * this.nodePaddingLevel;
      }
      return 0;
    }
    return super._computeNodePaddingLeft(node);
  }

  /**
   * @override Tree.js
   */
  _remove() {
    super._remove();
    this._removeTitle();
    this._removeIcon();
  }

  _renderTitle() {
    if (this.titleVisible) {
      if (!this.$title) {
        this.$title = this.$container.prependDiv('outline-title')
          .on('mousedown', this._onTitleMouseDown.bind(this))
          .toggleClass('touch', Device.get().supportsOnlyTouch());
        this.$titleText = this.$title.prependDiv('outline-title-text');
      }
      this.$titleText.text(this.title);
    }
  }

  _removeTitle() {
    if (this.titleVisible) {
      this.$title.remove();
      this.$title = null;
    }
  }

  setIconVisible(iconVisible) {
    this.setProperty('iconVisible', iconVisible);
    if (this.rendered) {
      this._updateIcon();
    }
  }

  setIconId(iconId) {
    this.setProperty('iconId', iconId);
    if (this.rendered) {
      this._updateIcon();
    }
  }

  _updateIcon() {
    if (this.titleVisible && this.iconVisible && this.iconId) {
      if (this.icon) {
        this.icon.setIconDesc(this.iconId);
        return;
      }
      this.icon = scout.create('Icon', {
        parent: this,
        iconDesc: this.iconId,
        prepend: true
      });
      this.icon.render(this.$title);
    } else {
      if (!this.icon) {
        return;
      }
      this.icon.remove();
      this.icon = null;
    }
  }

  _removeIcon() {
    if (this.icon) {
      this.icon.remove();
      this.icon = null;
    }
  }

  _renderTitleMenuBar() {
    if (this.titleVisible) {
      this.titleMenuBar.render(this.$title);
      this.titleMenuBar.$container.addClass('prevent-initial-focus');
    }
  }

  /**
   * @override
   */
  _renderEnabled() {
    super._renderEnabled();
    this.$container.setTabbable(false);
  }

  /**
   * @override
   */
  _initTreeNodeInternal(node, parentNode) {
    super._initTreeNodeInternal(node, parentNode);
    this._initDetailTableAndForm(node);
    this.trigger('pageInit', {
      page: node
    });
  }

  _initDetailTableAndForm(node) {
    if (node.detailTable) {
      this._initDetailTable(node);
    }
    if (node.detailForm) {
      this._initDetailForm(node);
    }
  }

  _initDetailTable(node) {
    if (this.navigateButtonsVisible && node.navigateButtonsVisible) {
      this._appendNavigateButtonsForDetailTable(node);
    }
  }

  _initDetailForm(node) {
    if (this.navigateButtonsVisible && node.navigateButtonsVisible) {
      this._appendNavigateButtonsForDetailForm(node);
    }

    // Mark form as detail form
    node.detailForm.detailForm = true;
    node.detailForm.one('destroy', function() {
      // Unlink detail form if it was closed. May happen in the following case:
      // The form gets closed on execPageDeactivated. No pageChanged event will
      // be fired because the deactivated page is not selected anymore.
      node.detailForm = null;
      // Also make sure other objects hold no reference to a destroyed form (e.g. bench)
      this._triggerPageChanged(node);
    }.bind(this));
  }

  // Info: we pass the keyStrokeContext of the parent (table or form) to
  // the created buttons, we cannot use keyStrokeContext of the outline
  // because that context is disabled when the outline is collapsed. We
  // cannot set the property 'keyStrokeContext' because this would interfere
  // with the default keyStrokeContext which is already created when the CTOR
  // of Widget runs.
  _createNavigateButtons(node, parent) {
    var menus = arrays.ensure(parent.staticMenus);
    if (!this._hasMenu(menus, NavigateUpButton)) {
      var upButton = scout.create('NavigateUpButton', {
        parent: parent,
        altKeyStrokeContext: parent.keyStrokeContext,
        outline: this,
        node: node
      });
      menus.push(upButton);
    }
    if (!this._hasMenu(menus, NavigateDownButton)) {
      var downButton = scout.create('NavigateDownButton', {
        parent: parent,
        altKeyStrokeContext: parent.keyStrokeContext,
        outline: this,
        node: node
      });
      menus.push(downButton);
    }
    return menus;
  }

  _getMenu(menus, menuClass) {
    for (var i = 0; i < menus.length; i++) {
      if (menus[i] instanceof menuClass) {
        return menus[i];
      }
    }
    return null;
  }

  _hasMenu(menus, menuClass) {
    return this._getMenu(menus, menuClass) !== null;
  }

  _onTitleMouseDown(event) {
    if (this.titleMenuBar.rendered && this.titleMenuBar.$container.isOrHas(event.target)) {
      // Ignore clicks on title menubar
      return;
    }
    this.navigateToTop();
  }

  navigateToTop() {
    this.deselectAll();
    this.handleInitialExpanded();
    this.setScrollTop(0);
  }

  handleInitialExpanded() {
    this.visitNodes(function(node) {
      this.setNodeExpanded(node, node.initialExpanded, {
        renderExpansion: true
      });
    }.bind(this));
  }

  _onNodeDeleted(node) {
    // Destroy table, which is attached at the root adapter. Form gets destroyed by form close event
    if (node.detailTable) {
      node.detailTable.destroy();
      node.detailTable = null;
    }
  }

  /**
   * @override
   */
  selectNodes(nodes, debounceSend) {
    nodes = arrays.ensure(nodes);
    if (nodes.length > 0 && this.isNodeSelected(nodes[0])) {
      // Already selected, do nothing
      return;
    }
    if (nodes.length === 0 && this.selectedNodes.length === 0) {
      // Already unselected, do nothing
      return;
    }
    if (this.navigateUpInProgress) {
      this.navigateUpInProgress = false;
    } else {
      if (nodes.length === 1) {
        // When a node is selected, the detail form should never be hidden
        this.setDetailFormVisibleByUi(nodes[0], true);
      }
    }
    super.selectNodes(nodes, debounceSend);
  }

  /**
   * @override
   */
  _setSelectedNodes(nodes, debounceSend) {
    super._setSelectedNodes(nodes, debounceSend);
    // Needs to be done here so that tree.selectNodes() can restore scroll position correctly after the content has been updated
    this.updateDetailContent();
  }

  /**
   * @override
   */
  _nodesSelectedInternal() {
    var activePage = this.activePage();
    // This block here is similar to what's done in Java's DefaultPageChangeStrategy
    if (activePage) {
      activePage.activate();
      activePage.ensureLoadChildren().done(
        this._onLoadChildrenDone.bind(this, activePage));
    }
  }

  /**
   * @override
   */
  _renderSelection() {
    super._renderSelection();
    this.$container.toggleClass('node-selected', this.selectedNodes.length > 0);
  }

  setDefaultDetailForm(defaultDetailForm) {
    this.setProperty('defaultDetailForm', defaultDetailForm);
    this._updateOutlineOverview();
  }

  _setDefaultDetailForm(defaultDetailForm) {
    if (this.defaultDetailForm) {
      this.defaultDetailForm.detailForm = false;
    }
    this._setProperty('defaultDetailForm', defaultDetailForm);
    if (this.defaultDetailForm) {
      this.defaultDetailForm.detailForm = true;
    }
  }

  setOutlineOverviewVisible(outlineOverviewVisible) {
    this.setProperty('outlineOverviewVisible', outlineOverviewVisible);
    this._updateOutlineOverview();
  }

  _setOutlineOverviewVisible(outlineOverviewVisible) {
    this._setProperty('outlineOverviewVisible', outlineOverviewVisible);
  }

  setOutlineOverview(outlineOverview) {
    this.setProperty('outlineOverview', outlineOverview);
    this._updateOutlineOverview();
  }

  _setOutlineOverview(outlineOverview) {
    // Ensure outlineOverview is of type OutlineOverview.
    // Widget property cannot be used because nodes are not of type Page yet while _prepareWidgetProperty is running during initialization
    if (outlineOverview) {
      outlineOverview = this._createChild(outlineOverview);
    }
    this._setProperty('outlineOverview', outlineOverview);
  }

  _updateOutlineOverview() {
    if (this.defaultDetailForm) {
      if (this.outlineOverview) {
        this.outlineOverview.destroy();
        this._setOutlineOverview(null);
      }
    } else {
      if (this.outlineOverviewVisible) {
        if (!this.outlineOverview) {
          // Create outlineOverview if no defaultDetailForm is available
          this._setOutlineOverview(this._createOutlineOverview());
        }
      } else {
        if (this.outlineOverview) {
          this.outlineOverview.destroy();
          this._setOutlineOverview(null);
        }
      }
    }
  }

  _createOutlineOverview() {
    return scout.create('TileOutlineOverview', {
      parent: this,
      outline: this
    });
  }

  setNavigateButtonsVisible(navigateButtonsVisible) {
    this.setProperty('navigateButtonsVisible', navigateButtonsVisible);
  }

  _setNavigateButtonsVisible(navigateButtonsVisible) {
    this._setProperty('navigateButtonsVisible', navigateButtonsVisible);
    this.visitNodes(this._setNavigateButtonsVisibleForNode.bind(this));
  }

  _setNavigateButtonsVisibleForNode(node, parentNode) {
    if (this.navigateButtonsVisible) {
      if (node.detailForm) {
        this._appendNavigateButtonsForDetailForm(node);
      }
      if (node.detailTable) {
        this._appendNavigateButtonsForDetailTable(node);
      }
    } else {
      if (node.detailForm) {
        this._removeNavigateButtonsForDetailForm(node);
      }
      if (node.detailTable) {
        this._removeNavigateButtonsForDetailTable(node);
      }
    }
  }

  _appendNavigateButtonsForDetailForm(node) {
    var menus = this._createNavigateButtons(node, node.detailForm.rootGroupBox);
    node.detailForm.rootGroupBox.setStaticMenus(menus);
  }

  _appendNavigateButtonsForDetailTable(node) {
    var menus = this._createNavigateButtons(node, node.detailTable);
    node.detailTable.setStaticMenus(menus);
  }

  _removeNavigateButtonsForDetailForm(node) {
    var staticMenus = node.detailForm.rootGroupBox.staticMenus.filter(function(menu) {
      return !(menu instanceof NavigateButton);
    });
    node.detailForm.rootGroupBox.setStaticMenus(staticMenus);
  }

  _removeNavigateButtonsForDetailTable(node) {
    var staticMenus = node.detailTable.staticMenus.filter(function(menu) {
      return !(menu instanceof NavigateButton);
    });
    node.detailTable.setStaticMenus(staticMenus);
  }

  /**
   * @returns {TableRow} the selected row or null when no row is selected. When multiple rows are selected
   *    the first selected row is returned.
   */
  selectedRow() {
    var node = this.selectedNode();
    if (!node || !node.detailTable) {
      return null;
    }
    return node.detailTable.selectedRow();
  }

  /**
   * Called by updateItemPath.
   *
   * @override
   */
  _isGroupingEnd(node) {
    return node.nodeType === Page.NodeType.TABLE;
  }

  /**
   * Disabled for outlines because outline may be resized.
   */
  _isTruncatedNodeTooltipEnabled() {
    return false;
  }

  setDetailFormVisibleByUi(node, visible) {
    node.detailFormVisibleByUi = visible;
    this._triggerPageChanged(node);
  }

  validateFocus() {
    this.session.focusManager.validateFocus();
  }

  sendToBack() {
    this.inBackground = true;
    this._renderInBackground();

    // Detach child dialogs, message boxes and file choosers, not views.
    this.formController.detachDialogs();
    this.messageBoxController.detach();
    this.fileChooserController.detach();
  }

  bringToFront() {
    this.inBackground = false;
    this._renderInBackground();

    // Attach child dialogs, message boxes and file choosers.
    this.formController.attachDialogs();
    this.messageBoxController.attach();
    this.fileChooserController.attach();
  }

  _renderInBackground() {
    this.$container.toggleClass('in-background', this.inBackground);
  }

  _renderCompact() {
    this.$container.toggleClass('compact', this.compact);
    this.invalidateLayoutTree();
  }

  _renderEmbedDetailContent() {
    this.$data.toggleClass('has-detail-content', this.embedDetailContent);
    this.invalidateLayoutTree();
  }

  _renderDetailContent() {
    if (!this.detailContent || this.detailContent.rendered) {
      return;
    }
    var page = this.selectedNode();
    if (!page.rendered) {
      return;
    }

    this.detailContent.render(page.$node);
    if (this.detailContent.htmlComp) {
      this.detailContent.htmlComp.validateRoot = false;
    }
    this._ensurePageLayout(page);
    this.$data.addClass('detail-content-visible');
  }

  _ensurePageLayout(page) {
    // selected page now has content (menubar and form) -> needs a layout
    // always create new htmlComp, otherwise we would have to remove them when $node or outline gets remvoed
    page.htmlComp = HtmlComponent.install(page.$node, this.session);
    page.htmlComp.setLayout(new PageLayout(this, page));
  }

  _removeDetailContent() {
    if (!this.detailContent) {
      return;
    }
    this.detailContent.remove();
    this.$data.removeClass('detail-content-visible');
  }

  _postRenderViewRange() {
    super._postRenderViewRange();
    this._renderDetailContent();
    this._renderDetailMenuBarVisible();
    this._renderNodeMenuBarVisible();
  }

  setCompact(compact) {
    this.setProperty('compact', compact);
  }

  setEmbedDetailContent(embedDetailContent) {
    this.setProperty('embedDetailContent', embedDetailContent);
    this.updateDetailContent();
  }

  _onDetailContentDestroy(event) {
    this.setDetailContent(null);
    this.updateDetailMenus();
  }

  setDetailContent(content) {
    if (this.detailContent === content) {
      return;
    }
    if (this.rendered) {
      this._removeDetailContent();
    }
    if (this.detailContent) {
      this.detailContent.off('destroy', this._detailContentDestroyHandler);
    }
    if (this.detailContent instanceof TableRowDetail) {
      this.detailContent.destroy();
    }
    this._setProperty('detailContent', content);
    if (content) {
      content.on('destroy', this._detailContentDestroyHandler);
    }
    if (this.rendered) {
      this._renderDetailContent();
    }
    this.invalidateLayoutTree();
  }

  updateDetailContent() {
    if (!this.embedDetailContent) {
      this.setDetailContent(null);
      this.setDetailMenus([]);
      return;
    }

    this.setDetailMenuBarVisible(false);
    this.setNodeMenuBarVisible(false);
    this.setDetailContent(this._computeDetailContent());
    this.updateDetailMenus();
  }

  /**
   * @override
   */
  _updateScrollTopAfterSelection() {
    super._updateScrollTopAfterSelection();
    if (!this.embedDetailContent) {
      return;
    }
    // Layout immediate to prevent 'laggy' detail form visualization,
    // but not initially while desktop gets rendered because it will be done at the end anyway
    // It is important that this is done after _renderSelection, because node could be invisible due to the missing .selected class which means it won't be layouted
    this.validateLayoutTree();

    // Scroll to the parent node to hide ancestor nodes and give as much room as possible for the content
    if (this.selectedNodes[0] && this.selectedNodes[0].parentNode) {
      if (this.prevSelectedNode && this.prevSelectedNode.isDescendantOf(this.selectedNodes[0])) {
        // But don't do it on upwards navigation, in that case the tree will scroll to the optimal position by itself, see _updateScrollTopAfterSelection
        return;
      }
      this.scrollTo(this.selectedNodes[0].parentNode, {
        align: 'top',
        animate: true
      });
    }
  }

  _computeDetailContent() {
    var selectedPage = this.selectedNode();
    if (!selectedPage) {
      // Detail content is shown for the selected node only
      return null;
    }

    // if there is a detail form, use this
    if (selectedPage.detailForm && selectedPage.detailFormVisible && selectedPage.detailFormVisibleByUi) {
      return selectedPage.detailForm;
      // otherwise show the content of the table row
      // but never if parent is a node page -> the table contains only one column with no essential information
    } else if (selectedPage.row && selectedPage.parentNode.nodeType === Page.NodeType.TABLE) {
      return scout.create('TableRowDetail', {
        parent: this,
        table: selectedPage.parentNode.detailTable,
        page: selectedPage
      });
    }
    return null;
  }

  /**
   * Updates node and detail menubar.
   * Node menubar: Contains the table controls and right aligned menus.
   * Detail menubar: Contains the other menus.
   *
   * The menu items are gathered from various sources:
   * If the selected page has a detailForm, the menus are taken from there. Otherwise the detail table and the parent detail table provide the menus.
   * The detail table contributes the empty space menus and the parent detail the the single selection menus.
   *
   * The menus of the outline itself are not displayed. In fact the server won't deliver any.
   * One reason is that no menus are displayed in regular mode, so when switching to compact mode no menus would be available.
   * Another reason is that it would flicker because the menus are sent anew from the server every time a node gets selected because the menus are added to the outline and not to the node and are therefore not cached.
   */
  updateDetailMenus() {
    if (!this.embedDetailContent) {
      return;
    }
    var selectedPages = this.selectedNodes,
      selectedPage = selectedPages[0],
      menuItems = [],
      tableControls = [],
      nodeMenus = [],
      detailTable,
      detailMenus = [];

    if (this.detailContent && this.detailContent instanceof Form) {
      // get menus from detail form
      var rootGroupBox = this.detailContent.rootGroupBox;
      menuItems = rootGroupBox.processMenus.concat(rootGroupBox.menus);
      rootGroupBox.setMenuBarVisible(false);
      this._attachDetailMenusListener(rootGroupBox);
    } else if (selectedPage) {
      // get empty space menus and table controls from detail table
      if (selectedPage.detailTable) {
        detailTable = selectedPage.detailTable;
        menuItems = menus_1.filter(detailTable.menus, ['Table.EmptySpace'], false, true);
        tableControls = detailTable.tableControls;
        detailTable.setMenuBarVisible(false);
        this._attachDetailMenusListener(detailTable);
      }
      // get single selection menus from parent detail table
      var parentPage = selectedPage.parentNode;
      if (parentPage && parentPage.detailTable) {
        detailTable = parentPage.detailTable;
        menuItems = menuItems.concat(menus_1.filter(detailTable.menus, ['Table.SingleSelection'], false, true));
        detailTable.setMenuBarVisible(false);
        this._attachDetailMenusListener(detailTable);
      }
    }

    // Add table controls to nodeMenus
    tableControls.forEach(function(tableControl) {
      var menu = scout.create('TableControlAdapterMenu',
        TableControlAdapterMenu.adaptTableControlProperties(tableControl, {
          parent: this,
          tableControl: tableControl,
          horizontalAlignment: 1
        }));
      nodeMenus.push(menu);
    }, this);

    // Add right aligned menus to node menus, other to detail menus
    menuItems.forEach(function(menuItem) {
      if (menuItem.horizontalAlignment === 1) {
        nodeMenus.push(menuItem);
      } else {
        detailMenus.push(menuItem);
      }
    }, this);

    this.setNodeMenus(nodeMenus);
    this.setDetailMenus(detailMenus);
  }

  /**
   * Attaches a listener to the given menu container (which is the detail table or the detail table of the parent node)
   * in order to get dynamic menu changes and update the detailMenus on such a change event.
   * The impl. is lazy because it is only used in mobile mode.
   */
  _attachDetailMenusListener(menuContainer) {
    if (!this._detailMenusChangeHandler) {
      this._detailMenusChangeHandler = function(event) {
        if (event.propertyName === 'menus' || event.propertyName === 'tableControls') {
          this.updateDetailMenus();
        }
      }.bind(this);
    }
    if (!this._detailMenusDestroyHandler) {
      this._detailMenusDestroyHandler = function() {
        menuContainer.off('propertyChange', this._detailMenusChangeHandler);
      }.bind(this);
    }

    menuContainer.off('propertyChange', this._detailMenusChangeHandler);
    menuContainer.on('propertyChange', this._detailMenusChangeHandler);
    menuContainer.off('destroy', this._detailMenusDestroyHandler);
    menuContainer.one('destroy', this._detailMenusDestroyHandler);

    if (!this._detailMenusNodesSelectedHandler) {
      // This nodes selection listener removes the property change listeners from the old menu containers (detail content) whenever a node gets selected
      // updateDetailMenus() is called afterwards and attaches the property change listeners to the new detail content
      // This guarantees that no events are fired for non selected nodes
      this._detailMenusNodesSelectedHandler = {
        outline: this,
        menuContainers: [],
        addMenuContainer: function(container) {
          if (this.menuContainers.indexOf(container) > -1) {
            return;
          }
          this.menuContainers.push(container);
        },
        func: function(event) {
          if (event.type !== 'nodesSelected') {
            return;
          }
          this.menuContainers.forEach(function(container) {
            container.off('propertyChange', this.outline._detailMenusChangeHandler);
            container.off('destroy', this.outline._detailMenusDestroyHandler);
          }, this);
          this.menuContainers = [];
        }
      };
      this.addListener(this._detailMenusNodesSelectedHandler);
    }
    this._detailMenusNodesSelectedHandler.addMenuContainer(menuContainer);
  }

  setDetailMenus(detailMenus) {
    // Make sure detailMenus are rendered again even if they are the same as before
    // Reason: the menus could have been removed from the DOM in the meantime.
    // This happens if table#setMenus() is called while table is not rendered, which is always the case in compact mode.
    // In that case the parent is temporarily set to the table which will remove the menu.
    this.detailMenuBar.setMenuItems([]);
    this.detailMenuBar.setMenuItems(detailMenus);
    this.setDetailMenuBarVisible(this.detailMenuBar.menuItems.length > 0);
  }

  _renderDetailMenuBarVisible() {
    if (this.detailMenuBarVisible) {
      this._renderDetailMenuBar();
    } else {
      this._removeDetailMenuBar();
    }
  }

  _renderDetailMenuBar() {
    if (this.detailMenuBar.rendered) {
      return;
    }
    var node = this.selectedNode();
    if (!node || !node.rendered) {
      return;
    }

    this.detailMenuBar.render(node.$node);
    this.detailMenuBar.$container.addClass('detail-menubar');
    if (this.detailContent && this.detailContent.rendered) {
      // move before content (e.g. form)
      this.detailMenuBar.$container.insertBefore(this.detailContent.$container);
    }
    this._ensurePageLayout(node);
    this.invalidateLayoutTree();
  }

  _removeDetailMenuBar() {
    if (!this.detailMenuBar.rendered) {
      return;
    }
    this.detailMenuBar.remove();
    this.invalidateLayoutTree();
  }

  setDetailMenuBarVisible(visible) {
    this.setProperty('detailMenuBarVisible', visible);
  }

  setNodeMenus(nodeMenus) {
    // See setDetailMenus for the reason of the following code
    this.nodeMenuBar.setMenuItems([]);
    this.nodeMenuBar.setMenuItems(nodeMenus);
    this.setNodeMenuBarVisible(this.nodeMenuBar.menuItems.length > 0);
  }

  _renderNodeMenuBarVisible() {
    if (this.nodeMenuBarVisible) {
      this._renderNodeMenuBar();
    } else {
      this._removeNodeMenuBar();
    }
  }

  _renderNodeMenuBar() {
    if (this.nodeMenuBar.rendered) {
      return;
    }
    var node = this.selectedNode();
    if (!node || !node.rendered) {
      return;
    }

    var $text = node.$text;
    this.nodeMenuBar.render(node.$node);
    this.nodeMenuBar.$container.addClass('node-menubar');
    this.nodeMenuBar.$container.insertAfter($text);
    this.invalidateLayoutTree();
  }

  _removeNodeMenuBar() {
    if (!this.nodeMenuBar.rendered) {
      return;
    }
    this.nodeMenuBar.remove();
    this.invalidateLayoutTree();
  }

  setNodeMenuBarVisible(visible) {
    this.setProperty('nodeMenuBarVisible', visible);
  }

  glassPaneTargets() {
    // MessageBoxes are often created with Outlines as displayParent. The default implementation of this function
    // would not render any glass panes when the outline is collapsed, thus we need to override this behavior.
    return this._glassPaneTargets();
  }

  _glassPaneTargets(element) {
    var desktop = this.session.desktop;
    var $elements = [];
    if (desktop.navigation) {
      $elements.push(desktop.navigation.$body);
    }
    if (desktop.bench && element instanceof Form && element.displayHint === Form.DisplayHint.VIEW) {
      arrays.pushAll($elements, this._getBenchGlassPaneTargetsForView(element));
    }
    if (desktop.bench && desktop.bench.outlineContent) {
      arrays.pushAll($elements, desktop.bench.outlineContent.glassPaneTargets(element));
    }
    return $elements;
  }

  _getBenchGlassPaneTargetsForView(view) {
    var $glassPanes = [];
    $glassPanes = $glassPanes.concat(this._getTabGlassPaneTargetsForView(view, this.session.desktop.header));
    this.session.desktop.bench.visibleTabBoxes().forEach(function(tabBox) {
      if (tabBox.hasView(view)) {
        arrays.pushAll($glassPanes, this._getTabGlassPaneTargetsForView(view, tabBox));
      } else if (tabBox.$container) {
        $glassPanes.push(tabBox.$container);
      }
    }, this);
    return $glassPanes;
  }

  _getTabGlassPaneTargetsForView(view, tabBox) {
    var $glassPanes = [];
    tabBox.tabArea.tabs.forEach(function(tab) {
      if (tab.view !== view && tab.view.displayParent === this) {
        $glassPanes.push(tab.$container);
        // Workaround for javascript not being able to prevent hover event propagation:
        // In case of tabs, the hover selector is defined on the element that is the direct parent
        // of the glass pane. Under these circumstances, the hover style isn't be prevented by the glass pane.
        tab.$container.addClass('no-hover');
      }
    }.bind(this));
    return $glassPanes;
  }

  _onGlassPaneMouseDown(glassPaneOwner, $glassPane) {
    var desktop = this.session.desktop;
    if (desktop.navigation) {
      if ($glassPane.parent()[0] === desktop.navigation.$body[0]) {
        desktop.bringOutlineToFront();
      }
    }
  }

  /**
   * === Method required for objects that act as 'displayParent' ===
   *
   * Returns true if this outline is active and not in background.
   */
  inFront() {
    return this.session.desktop.outline === this && !this.inBackground;
  }

  /**
   * Called if outline acts as display parent.<p>
   * Returns true if outline is active, even if it is not rendered (e.g. when navigation is invisible)
   */
  acceptDialog(dialog) {
    return this.session.desktop.outline === this;
  }

  /**
   * Called if outline acts as display parent.<p>
   * Returns true if outline is active, even if it is not rendered (e.g. when navigation is invisible)
   */
  acceptView(view) {
    return this.session.desktop.outline === this;
  }

  // see Java: AbstractOutline#makeActivePageToContextPage
  activateCurrentPage() {
    var activePage = this.activePage();
    if (activePage) {
      activePage.activate();
    }
  }

  activePage() {
    return this.selectedNode();
  }

  _setViews(views) {
    if (views) {
      views.forEach(function(view) {
        view.setDisplayParent(this);
      }.bind(this));
    }
    this._setProperty('views', views);
  }

  /**
   * @override Tree.js (don't call parent)
   */
  _setMenus(menus) {
    var oldMenus = this.menus;
    this.updateKeyStrokes(menus, oldMenus);
    this._setProperty('menus', menus);
    if (this.titleMenuBar) { // _setMenus is called by parent class Tree.js, at this time titleMenuBar is not yet initialized
      var menuItems = menus_1.filter(this.menus, ['Tree.Header']);
      this.titleMenuBar.setMenuItems(menuItems);
    }
  }

  _triggerPageChanged(page) {
    this.trigger('pageChanged', {
      page: page
    });
  }

  _onLoadChildrenDone(activePage) {
    if (activePage) {
      this._initDetailTableAndForm(activePage);
    }
  }

  pageChanged(page) {
    if (page) {
      this._initDetailTableAndForm(page);
    }

    var selectedPage = this.selectedNode();
    if (!page && !selectedPage || page === selectedPage) {
      this.updateDetailContent();
    }

    this._triggerPageChanged(page);
  }
}

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
import {Action, arrays, ContextMenuPopup, Event, HtmlComponent, icons, MenuExecKeyStroke, MenuKeyStroke, objects, scout, strings, tooltips, TreeVisitResult} from '../index';

export default class Menu extends Action {

  constructor() {
    super();

    this.childActions = [];
    this.defaultMenu = null; // null = determined by the menu bar
    this.excludedByFilter = false;
    this.menuTypes = [];
    this.menuStyle = Menu.MenuStyle.NONE;
    /**
     * This property is true when the menu instance was moved into a overflow-menu
     * when there's not enough space on the screen (see MenuBarLayout.js). When set
     * to true, button style menus must be displayed as regular menus.
     */
    this.overflown = false;
    /**
     * This property is set if this is a subMenu
     */
    this.parentMenu = null;
    this.popup = null;
    this.popupHorizontalAlignment = undefined;
    this.popupVerticalAlignment = undefined;
    this.stackable = true;
    this.separator = false;
    this.shrinkable = false;
    this.subMenuVisibility = Menu.SubMenuVisibility.DEFAULT;

    this.menuFilter = null;

    this._addCloneProperties(['defaultMenu', 'menuTypes', 'overflow', 'stackable', 'separator', 'shrinkable', 'parentMenu', 'menuFilter']);
    this._addWidgetProperties('childActions');
  }

  static SUBMENU_ICON = icons.ANGLE_DOWN_BOLD;

  /**
   * Special styles of the menu, calculated by the MenuBar. The default value is MenuStyle.NONE.
   */
  static MenuStyle = {
    NONE: 0,
    DEFAULT: 1
  };

  static SubMenuVisibility = {
    /**
     * Default: sub-menu icon is only visible when menu has text.
     */
    DEFAULT: 'default',
    /**
     * Text or icon: sub-menu icon is only visible when menu has text or an icon.
     */
    TEXT_OR_ICON: 'textOrIcon',
    /**
     * Always: sub-menu icon is always visible when menu has child-actions.
     */
    ALWAYS: 'always'
  };

  _init(options) {
    super._init(options);
    this._setChildActions(this.childActions);
  }

  /**
   * @override
   */
  _initKeyStrokeContext() {
    super._initKeyStrokeContext();

    this.keyStrokeContext.registerKeyStroke(new MenuExecKeyStroke(this));
  }

  _render() {
    if (this.separator) {
      this._renderSeparator();
    } else {
      this._renderItem();
    }
    this.$container.unfocusable();
    this.htmlComp = HtmlComponent.install(this.$container, this.session);
  }

  _renderProperties() {
    super._renderProperties();
    this._renderOverflown();
    this._renderMenuStyle();
    this._renderActionStyle();
  }

  _remove() {
    super._remove();
    this.$submenuIcon = null;
    this.$subMenuBody = null;
  }

  _renderSeparator() {
    this.$container = this.$parent.appendDiv('menu-separator');
  }

  _renderItem() {
    this.$container = this.$parent.appendDiv('menu-item');
    if (this.uiCssClass) {
      this.$container.addClass(this.uiCssClass);
    }

    var mouseEventHandler = this._onMouseEvent.bind(this);
    this.$container
      .on('mousedown', mouseEventHandler)
      .on('contextmenu', mouseEventHandler)
      .on('click', mouseEventHandler);

    this._renderSubMenuIcon();
  }

  _renderActionStyle() {
    this.$container.toggleClass('menu-button', this.isButton() && !this.overflown);
  }

  _renderSelected() {
    if (!this._doActionTogglesSubMenu()) {
      super._renderSelected();
      // Cannot be done in ContextMenuPopup,
      // because the property change event is fired before renderSelected is called,
      // and updateNextToSelected depends on the UI state
      if (this.parent instanceof ContextMenuPopup) {
        this.parent.updateNextToSelected();
      }
    }
    if (this.selected) {
      if (this._doActionTogglesSubMenu()) {
        this._renderSubMenuItems(this, this.childActions);
      } else if (this._doActionTogglesPopup()) {
        this._openPopup();
      }
    } else {
      if (this._doActionTogglesSubMenu() && this.rendered) {
        this._removeSubMenuItems(this);
      } else {
        this._closePopup();
        this._closeSubMenues();
      }
    }
  }

  _closeSubMenues() {
    this.childActions.forEach(function(menu) {
      if (menu._doActionTogglesPopup()) {
        menu._closeSubMenues();
        menu.setSelected(false);
      }
    });
  }

  _removeSubMenuItems(parentMenu) {
    if (this.parent instanceof ContextMenuPopup) {
      this.parent.removeSubMenuItems(parentMenu, true);
    } else if (this.parent instanceof Menu) {
      this.parent._removeSubMenuItems(parentMenu);
    }
  }

  _renderSubMenuItems(parentMenu, menus) {
    if (this.parent instanceof ContextMenuPopup) {
      this.parent.renderSubMenuItems(parentMenu, menus, true);
      var closeHandler = function(event) {
        parentMenu.setSelected(false);
      };
      var propertyChangeHandler = function(event) {
        if (event.propertyName === 'selected' && event.newValue === false) {
          this.parent.off('close', closeHandler);
          parentMenu.off('propertyChange', propertyChangeHandler);
        }
      }.bind(this);
      this.parent.on('close', closeHandler);
      parentMenu.on('propertyChange', propertyChangeHandler);
    } else if (this.parent instanceof Menu) {
      this.parent._renderSubMenuItems(parentMenu, menus);
    }
  }

  /**
   * Override this method to control the toggles sub-menu behavior when this menu instance is used as parent.
   * Some menu sub-classes like the ComboMenu need to show the popup menu instead.
   * @see: #_doActionTogglesSubMenu
   */
  _togglesSubMenu() {
    return true;
  }

  _doActionTogglesSubMenu() {
    if (!this.childActions.length) {
      return false;
    }
    if (this.parent instanceof ContextMenuPopup) {
      return true;
    }
    if (this.parent instanceof Menu) {
      return this.parent._togglesSubMenu();
    }
    return false;
  }

  _getSubMenuLevel() {
    if (this.parent instanceof ContextMenuPopup) {
      return 0;
    }
    return super._getSubMenuLevel() + 1;
  }

  _onMouseEvent(event) {
    if (event.type === 'mousedown') {
      this._doubleClickSupport.mousedown(event);
    }
    if (!this._allowMouseEvent(event)) {
      return;
    }

    // When the action is clicked the user wants to execute the action and not see the tooltip -> cancel the task
    // If it is already displayed it will stay
    tooltips.cancel(this.$container);

    // If menu has childActions, a popup should be rendered on click. To create
    // the impression of a faster UI, open the popup already on 'mousedown', not
    // on 'click'. All other actions are handled on 'click'.
    if (event.type === 'mousedown' && this._doActionTogglesPopup()) {
      this.doAction();
    } else if ((event.type === 'click' || event.type === 'contextmenu') && !this._doActionTogglesPopup()) {
      this.doAction();
    }
  }

  /**
   * May be overridden if the criteria to open a popup differs
   */
  _doActionTogglesPopup() {
    return this.childActions.length > 0;
  }

  /**
   * Only render child actions if the sub-menu popup is open.
   */
  _renderChildActions() {
    if (objects.optProperty(this.popup, 'rendered')) {
      var $popup = this.popup.$container;
      this.childActions.forEach(function(menu) {
        menu.render($popup);
      });
    }

    this._renderSubMenuIcon();
  }

  _renderSubMenuIcon() {
    var visible = false;

    // calculate visibility of sub-menu icon
    if (this.childActions.length > 0) {
      switch (this.subMenuVisibility) {
        case Menu.SubMenuVisibility.DEFAULT:
          visible = this._hasText();
          break;
        case Menu.SubMenuVisibility.TEXT_OR_ICON:
          visible = this._hasText() || this.iconId;
          break;
        case Menu.SubMenuVisibility.ALWAYS:
          visible = true;
          break;
      }
    }

    if (visible) {
      if (!this.$submenuIcon) {
        var icon = icons.parseIconId(Menu.SUBMENU_ICON);
        this.$submenuIcon = this.$container
          .appendSpan('submenu-icon')
          .text(icon.iconCharacter);
        this.invalidateLayoutTree();
      }
    } else {
      if (this.$submenuIcon) {
        this.$submenuIcon.remove();
        this.$submenuIcon = null;
        this.invalidateLayoutTree();
      }
    }
  }

  _renderText(text) {
    super._renderText(text);
    // Ensure submenu-icon is the last element in the DOM
    if (this.$submenuIcon) {
      this.$submenuIcon.appendTo(this.$container);
    }
    this.$container.toggleClass('has-text', strings.hasText(this.text) && this.textVisible);
    this._updateIconAndTextStyle();
    this.invalidateLayoutTree();
  }

  _renderIconId() {
    super._renderIconId();
    this.$container.toggleClass('has-icon', !!this.iconId);
    this._updateIconAndTextStyle();
    this.invalidateLayoutTree();
  }

  isTabTarget() {
    return this.enabledComputed && this.visible && !this.overflown && (this.isButton() || !this.separator);
  }

  /**
   * @override Widget.js
   */
  recomputeEnabled(parentEnabled) {
    if (parentEnabled === undefined) {
      parentEnabled = this._getInheritedAccessibility();
    }

    var enabledComputed;
    var enabledStateForChildren;
    if (this.enabled && this.inheritAccessibility && !parentEnabled && this.childActions.length > 0) {
      // the enabledComputed state here depends on the child actions:
      // - if there are childActions which have inheritAccessibility=false (recursively): this action must be enabledComputed=true so that these children can be reached
      // - otherwise this menu is set to enabledComputed=false
      enabledComputed = this._hasAccessibleChildMenu();
      if (enabledComputed) {
        // this composite menu is only active because it has children with inheritAccessibility=true
        // but child-menus should consider the container parent instead, otherwise all children would be enabled (because this composite menu is enabled now)
        enabledStateForChildren = parentEnabled;
      } else {
        enabledStateForChildren = false;
      }
    } else {
      enabledComputed = this._computeEnabled(this.inheritAccessibility, parentEnabled);
      enabledStateForChildren = enabledComputed;
    }

    this._updateEnabledComputed(enabledComputed, enabledStateForChildren);
  }

  /**
   * Calculates the inherited enabled state of this menu. This is the enabled state of the next relevant parent.
   * A relevant parent is either
   * - the next parent menu with inheritAccessibility=false
   * - or the container of the menu (the parent of the root menu)
   *
   * The enabled state of the container must be used because the parent menu might be a menu which is only enabled because it has children with inheritAccessibility=false.
   * One exception: if a parent menu itself is inheritAccessibility=false. Then the container is not relevant anymore but this parent is taken instead.
   */
  _getInheritedAccessibility() {
    var menu = this;
    var rootMenu = menu;
    while (menu) {
      if (!menu.inheritAccessibility) {
        // not inherited. no need to check any more parent widgets
        return menu.enabled; /* do not use enabledComputed here because the parents have no effect */
      }
      rootMenu = menu;
      menu = menu.parentMenu;
    }

    var container = rootMenu.parent;
    if (container && container.initialized && container.enabledComputed !== undefined) {
      return container.enabledComputed;
    }
    return true;
  }

  _findRootMenu() {
    var menu = this;
    var result;
    while (menu) {
      result = menu;
      menu = menu.parentMenu;
    }
    return result;
  }

  _hasAccessibleChildMenu() {
    var childFound = false;
    this.visitChildMenus(function(child) {
      if (!child.inheritAccessibility && child.enabled /* do not use enabledComputed here */ && child.visible) {
        childFound = true;
        return TreeVisitResult.TERMINATE;
      }
      return TreeVisitResult.CONTINUE;
    });
    return childFound;
  }

  /**
   * cannot use Widget#visitChildren() here because the child actions are not always part of the children collection
   * e.g. for ellipsis menus which declare childActions as 'PreserveOnPropertyChangeProperties'. this means the childActions are not automatically added to the children list even it is a widget property!
   */
  visitChildMenus(visitor) {
    for (var i = 0; i < this.childActions.length; i++) {
      var child = this.childActions[i];
      if (child instanceof Menu) {
        var treeVisitResult = visitor(child);
        if (treeVisitResult === true || treeVisitResult === TreeVisitResult.TERMINATE) {
          // Visitor wants to abort the visiting
          return TreeVisitResult.TERMINATE;
        } else if (treeVisitResult !== TreeVisitResult.SKIP_SUBTREE) {
          treeVisitResult = child.visitChildMenus(visitor);
          if (treeVisitResult === true || treeVisitResult === TreeVisitResult.TERMINATE) {
            return TreeVisitResult.TERMINATE;
          }
        }
      }
    }
  }

  _hasText() {
    return strings.hasText(this.text) && this.textVisible;
  }

  _updateIconAndTextStyle() {
    var hasText = this._hasText();
    var hasTextAndIcon = !!(hasText && this.iconId);
    this.$container.toggleClass('menu-textandicon', hasTextAndIcon);
    this.$container.toggleClass('menu-icononly', !hasText);
  }

  _closePopup() {
    if (this.popup) {
      this.popup.close();
    }
  }

  _openPopup() {
    if (this.popup) {
      // already open
      return;
    }
    this.popup = this._createPopup();
    this.popup.open();
    this.popup.on('remove', function(event) {
      this.popup = null;
    }.bind(this));
    // Reason for separating remove and close event:
    // Remove may be called if parent (menubar) gets removed or rebuilt.
    // In that case, we do not want to change the selected state because after rebuilding the popup should still be open
    // In every other case the state of the menu needs to be reset if the popup closes
    this.popup.on('close', function(event) {
      this.setSelected(false);
    }.bind(this));

    if (this.uiCssClass) {
      this.popup.$container.addClass(this.uiCssClass);
    }
  }

  _createPopup(event) {
    var options = {
      parent: this,
      menu: this,
      menuFilter: this.menuFilter,
      ignoreEvent: event,
      horizontalAlignment: this.popupHorizontalAlignment,
      verticalAlignment: this.popupVerticalAlignment
    };

    return scout.create('MenuBarPopup', options);
  }

  _createActionKeyStroke() {
    return new MenuKeyStroke(this);
  }

  isToggleAction() {
    return this.childActions.length > 0 || this.toggleAction;
  }

  isButton() {
    return Action.ActionStyle.BUTTON === this.actionStyle;
  }

  addChildActions(childActions) {
    var newActions = this.childActions.slice();
    arrays.pushAll(newActions, arrays.ensure(childActions));
    this.setChildActions(newActions);
  }

  setChildActions(childActions) {
    this.setProperty('childActions', childActions);
  }

  _setChildActions(childActions) {
    // disconnect existing
    this.childActions.forEach(function(childAction) {
      childAction.parentMenu = null;
    });

    this._setProperty('childActions', childActions);

    // connect new actions
    this.childActions.forEach(function(childAction) {
      childAction.parentMenu = this;
    }.bind(this));

    if (this.initialized) {
      this.recomputeEnabled();
    }
  }

  /**
   * @override Widget.js
   */
  _setInheritAccessibility(inheritAccessibility) {
    this._setProperty('inheritAccessibility', inheritAccessibility);
    if (this.initialized) {
      this._findRootMenu().recomputeEnabled();
    }
  }

  /**
   * @override Widget.js
   */
  _setEnabled(enabled) {
    this._setProperty('enabled', enabled);
    if (this.initialized) {
      this._findRootMenu().recomputeEnabled();
    }
  }

  _setVisible(visible) {
    this._setProperty('visible', visible);
    if (this.initialized) {
      this._findRootMenu().recomputeEnabled();
    }
  }

  setSelected(selected) {
    if (selected === this.selected) {
      return;
    }
    super.setSelected(selected);
    if (!this._doActionTogglesSubMenu() && !this._doActionTogglesPopup()) {
      return;
    }
    // If menu toggles a popup and is in an ellipsis menu which is not selected it needs a special treatment
    if (this.overflowMenu && !this.overflowMenu.selected) {
      this._handleSelectedInEllipsis();
    }
  }

  _handleSelectedInEllipsis() {
    // If the selection toggles a popup, open the ellipsis menu as well, otherwise the popup would not be shown
    if (this.selected) {
      this.overflowMenu.setSelected(true);
    }
  }

  setStackable(stackable) {
    this.setProperty('stackable', stackable);
  }

  setShrinkable(shrinkable) {
    this.setProperty('shrinkable', shrinkable);
  }

  /**
   * For internal usage only.
   * Used by the MenuBarLayout when a menu is moved to the ellipsis drop down.
   */
  _setOverflown(overflown) {
    if (this.overflown === overflown) {
      return;
    }
    this._setProperty('overflown', overflown);
    if (this.rendered) {
      this._renderOverflown();
    }
  }

  _renderOverflown() {
    this.$container.toggleClass('overflown', this.overflown);
    this._renderActionStyle();
  }

  setMenuStyle(menuStyle) {
    this.setProperty('menuStyle', menuStyle);
  }

  _renderMenuStyle() {
    this.$container.toggleClass('default-menu', this.menuStyle === Menu.MenuStyle.DEFAULT);
  }

  setDefaultMenu(defaultMenu) {
    this.setProperty('defaultMenu', defaultMenu);
  }

  setMenuFilter(menuFilter) {
    this.setProperty('menuFilter', menuFilter);
    this.childActions.forEach(function(child) {
      child.setMenuFilter(menuFilter);
    });
  }

  clone(model, options) {
    var clone = super.clone(model, options);
    this._deepCloneProperties(clone, 'childActions', options);
    clone._setChildActions(clone.childActions);
    return clone;
  }

  /**
   * @override
   */
  focus() {
    var event = new Event({source: this});
    this.trigger('focus', event);
    if (!event.defaultPrevented) {
      return super.focus();
    }
    return false;
  }
}

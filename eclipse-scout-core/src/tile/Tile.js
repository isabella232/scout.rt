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
import {GridData, HtmlComponent, LoadingSupport, SingleLayout, strings, Widget} from '../index';
import $ from 'jquery';

export default class Tile extends Widget {

  constructor() {
    super();
    this.displayStyle = Tile.DisplayStyle.DEFAULT;
    this.filterAccepted = true;
    this.gridData = null;
    this.gridDataHints = new GridData();
    this.colorScheme = null;
    this.selected = false;
    this.selectable = false;
  }

  // These constants need to correspond to the IDs defined in TileColorScheme.java
  static ColorSchemeId = {
    DEFAULT: 'default',
    ALTERNATIVE: 'alternative',
    RAINBOW: 'rainbow'
  };

  static DisplayStyle = {
    DEFAULT: 'default',
    PLAIN: 'plain'
  };

  /**
   * @override
   */
  _createLoadingSupport() {
    return new LoadingSupport({
      widget: this
    });
  }

  _init(model) {
    super._init(model);
    this._setGridDataHints(this.gridDataHints);
    this._setColorScheme(this.colorScheme);
    this._setSelectable(this.selectable);
  }

  _render() {
    this.$container = this.$parent.appendDiv('tile');
    this.htmlComp = HtmlComponent.install(this.$container, this.session);
    this.htmlComp.setLayout(new SingleLayout());
  }

  _renderProperties() {
    super._renderProperties();
    this._renderColorScheme();
    this._renderSelectable();
    this._renderSelected();
    this._renderDisplayStyle();
  }

  _postRender() {
    this.$container.addClass('tile');
    // Make sure prefSize returns the size the tile has after the animation even if it is called while the animation runs
    // Otherwise the tile may have the wrong size after making a tile with useUiHeight = true visible
    this.htmlComp.layout.animateClasses = ['animate-visible', 'animate-invisible', 'animate-insert', 'animate-remove'];
  }

  _renderDisplayStyle() {
    this.$container.toggleClass('default-tile', this.displayStyle === Tile.DisplayStyle.DEFAULT);
  }

  setGridDataHints(gridData) {
    this.setProperty('gridDataHints', gridData);
    if (this.rendered) {
      // Do it here instead of _renderGridDataHints because grid does not need to be invalidated when rendering, only when hints change
      // Otherwise it forces too many unnecessary recalculations when tile grid is rendering tiles due to virtual scrolling
      this.parent.invalidateLogicalGrid();
    }
  }

  _setGridDataHints(gridData) {
    if (!gridData) {
      gridData = new GridData();
    }
    this._setProperty('gridDataHints', GridData.ensure(gridData));
  }

  setColorScheme(colorScheme) {
    this.setProperty('colorScheme', colorScheme);
  }

  _setColorScheme(colorScheme) {
    var defaultScheme = {
      scheme: Tile.ColorSchemeId.DEFAULT,
      inverted: false
    };
    colorScheme = this._ensureColorScheme(colorScheme);
    colorScheme = $.extend({}, defaultScheme, colorScheme);
    this._setProperty('colorScheme', colorScheme);
  }

  /**
   * ColorScheme may be a string -> convert to an object
   */
  _ensureColorScheme(colorScheme) {
    if (typeof colorScheme === 'object') {
      return colorScheme;
    }
    var colorSchemeObj = {};
    if (typeof colorScheme === 'string') {
      // Split up colorScheme in two individual parts ("scheme" and "inverted").
      // This information is then used when rendering the color scheme.
      if (strings.startsWith(colorScheme, Tile.ColorSchemeId.ALTERNATIVE)) {
        colorSchemeObj.scheme = Tile.ColorSchemeId.ALTERNATIVE;
      }
      if (strings.startsWith(colorScheme, Tile.ColorSchemeId.RAINBOW)) {
        colorSchemeObj.scheme = Tile.ColorSchemeId.RAINBOW;
      }
      colorSchemeObj.inverted = strings.endsWith(colorScheme, '-inverted');
    }
    return colorSchemeObj;
  }

  _renderColorScheme() {
    this.$container.toggleClass('color-alternative', (this.colorScheme.scheme === Tile.ColorSchemeId.ALTERNATIVE));
    this.$container.toggleClass('color-rainbow', (this.colorScheme.scheme === Tile.ColorSchemeId.RAINBOW));
    this.$container.toggleClass('inverted', this.colorScheme.inverted);
  }

  setSelected(selected) {
    if (selected && !this.selectable) {
      return;
    }
    this.setProperty('selected', selected);
  }

  _renderSelected() {
    this.$container.toggleClass('selected', this.selected);
  }

  setSelectable(selectable) {
    this.setProperty('selectable', selectable);
  }

  _setSelectable(selectable) {
    this._setProperty('selectable', selectable);
    if (!this.selectable) {
      this.setSelected(false);
    }
  }

  _renderSelectable() {
    this.$container.toggleClass('selectable', this.selectable);
  }

  setFilterAccepted(filterAccepted) {
    this.setProperty('filterAccepted', filterAccepted);
  }

  _renderFilterAccepted() {
    this._renderVisible();
  }

  _renderVisible() {
    if (this.rendering) {
      this.$container.setVisible(this.isVisible());
      return;
    }
    if (this.removalPending) {
      // Do nothing if removal is in progress. May happen if filter is set, tile is removed by the filter animation, filter is removed again while animation is still running
      // Adding animate-visible in that case would trigger the animationEnd listener of widget._removeAnimated even though it is not the remove animation which finishes
      // That would cause the animate-visible animation to be executed twice because tileGrid._renderTile would render the tile and start the animation anew.
      return;
    }
    if (!this.isVisible()) {
      // Remove animate-visible first to show correct animation even if tile is made invisible while visible animation is still in progress
      // It is also necessary if the container is made invisible before the animation is finished because animationEnd won't fire in that case
      // which means that animate-invisible is still on the element and will trigger the (wrong) animation when container is made visible again
      this.$container.removeClass('invisible animate-visible');
      this.$container.addClassForAnimation('animate-invisible');
      this.$container.oneAnimationEnd(function() {
        // Make the element invisible after the animation (but only if visibility has not changed again in the meantime)
        this.$container.setVisible(this.isVisible());
      }.bind(this));
    } else {
      this.$container.addClass('invisible'); // Don't show it until it has the correct size and position to prevent flickering (Scout JS, non virtual)
      this.$container.setVisible(true);
      // Wait until the tile is layouted before trying to animate it to make sure the layout does not read the size while the animation runs (because it will be the wrong one)
      this.session.layoutValidator.schedulePostValidateFunction(function() {
        if (!this.rendered || !this.isVisible()) {
          return;
        }
        this.$container.removeClass('invisible animate-invisible');
        this.$container.addClassForAnimation('animate-visible');
      }.bind(this));
    }
    this.invalidateParentLogicalGrid();
  }

  /**
   * @override
   */
  isVisible() {
    return this.visible && this.filterAccepted;
  }
}

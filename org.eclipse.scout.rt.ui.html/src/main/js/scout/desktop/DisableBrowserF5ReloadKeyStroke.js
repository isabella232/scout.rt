/*******************************************************************************
 * Copyright (c) 2014-2016 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
/**
 * Global key stroke on the desktop that prevents 'leaking' of the F5 keystroke to the browser.
 *
 * F5 is used in Scout applications to reload table pages or invoke application-specific logic.
 * If the application does not consume the key, some browsers would reload the page. This can
 * be confusing and annoying for the user. For example when the user presses F5 on a table
 * page to reload the data, but the table is covered with a glass pane (e.g. busy indicator
 * is active because of slow network connection), the browser would simply reload the page
 * (i.e. create a new UiSession) instead of updating the data from the database.
 *
 * To reload the page, the general key stroke 'Ctrl-R' ('Command-R' on Macintosh, respectively)
 * should be used instead.
 */
scout.DisableBrowserF5ReloadKeyStroke = function(desktop) {
  scout.DisableBrowserF5ReloadKeyStroke.parent.call(this);
  this.field = desktop;

  this.which = [scout.keys.F5];
  this.preventDefault = true;
  this.keyStrokeFirePolicy = scout.Action.KeyStrokeFirePolicy.ALWAYS; // ignore glass panes
};
scout.inherits(scout.DisableBrowserF5ReloadKeyStroke, scout.KeyStroke);

/**
 * @override KeyStroke.js
 */
scout.DisableBrowserF5ReloadKeyStroke.prototype.handle = function(event) {
  // NOP
};

/*
 * Copyright (c) 2010-2020 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
import {FormSpecHelper} from '../../src/testing/index';
import {scout} from '../../src/index';

describe('ModeSelector', function() {
  var session;
  var helper;

  beforeEach(function() {
    setFixtures(sandbox());
    session = sandboxSession();
    helper = new FormSpecHelper(session);
    jasmine.clock().install();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  function expectEnabled(field, expectedEnabled, expectedEnabledComputed, hasClass) {
    expect(field.enabled).toBe(expectedEnabled);
    expect(field.enabledComputed).toBe(expectedEnabledComputed);
    if (hasClass) {
      expect(field.$container).toHaveClass(hasClass);
    }
  }

  describe('enabled', function() {
    it('propagation', function() {
      var modeSelector = helper.createModeSelector(session.desktop, 2);
      modeSelector.render();

      expectEnabled(modeSelector, true, true);
      expectEnabled(modeSelector.modes[0], true, true);
      expectEnabled(modeSelector.modes[1], true, true);

      modeSelector.setEnabled(false);
      expectEnabled(modeSelector, false, false, 'disabled');
      expectEnabled(modeSelector.modes[0], true, false, 'disabled');
      expectEnabled(modeSelector.modes[1], true, false, 'disabled');
    });
  });

  describe('init', function() {
    it('sets the selectedMode if it is provided', function() {
      var mode1 = scout.create('Mode', {
        parent: session.desktop,
        ref: 1
      });
      var modeSelector = scout.create('ModeSelector', {
        objectType: 'ModeSelector',
        parent: session.desktop,
        selectedMode: mode1,
        modes: [{
          objectType: 'Mode',
          ref: 0
        }, mode1]
      });

      expect(modeSelector.selectedMode).toBe(modeSelector.modes[1]);
      expect(modeSelector.modes[0].selected).toBe(false);
      expect(modeSelector.modes[1].selected).toBe(true);
    });

    it('selects the correct mode if it is selected', function() {
      var modeSelector = scout.create('ModeSelector', {
        parent: session.desktop,
        modes: [{
          objectType: 'Mode'
        }, {
          objectType: 'Mode',
          selected: true
        }]
      });
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[1]);
      expect(modeSelector.modes[0].selected).toBe(false);
      expect(modeSelector.modes[1].selected).toBe(true);
    });
  });

  describe('selectModeByRef', function() {
    it('updates the currently selected mode', function() {
      var modeSelector = scout.create('ModeSelector', {
        parent: session.desktop,
        modes: [{
          objectType: 'Mode',
          ref: 0
        }, {
          objectType: 'Mode',
          ref: 1
        }]
      });
      modeSelector.render();

      modeSelector.selectModeByRef(1);
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[1]);
      expect(modeSelector.modes[0].selected).toBe(false);
      expect(modeSelector.modes[1].selected).toBe(true);

      modeSelector.selectModeByRef(0);
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[0]);
      expect(modeSelector.modes[0].selected).toBe(true);
      expect(modeSelector.modes[1].selected).toBe(false);
    });
  });

  describe('selectModeById', function() {
    it('updates the currently selected mode', function() {
      var modeSelector = scout.create('ModeSelector', {
        parent: session.desktop,
        modes: [{
          objectType: 'Mode',
          id: 0
        }, {
          objectType: 'Mode',
          id: 1
        }]
      });
      modeSelector.render();

      modeSelector.selectModeById(1);
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[1]);
      expect(modeSelector.modes[0].selected).toBe(false);
      expect(modeSelector.modes[1].selected).toBe(true);

      modeSelector.selectModeById(0);
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[0]);
      expect(modeSelector.modes[0].selected).toBe(true);
      expect(modeSelector.modes[1].selected).toBe(false);
    });
  });

  describe('setSelectedMode', function() {
    it('unselects every mode when setting it to null', function() {
      var modeSelector = scout.create('ModeSelector', {
        parent: session.desktop,
        modes: [{
          objectType: 'Mode',
          ref: 0
        }, {
          objectType: 'Mode',
          ref: 1,
          selected: true
        }]
      });
      modeSelector.render();

      expect(modeSelector.selectedMode).toBe(modeSelector.modes[1]);

      modeSelector.setSelectedMode(null);
      expect(modeSelector.selectedMode).toBe(null);
      expect(modeSelector.modes[0].selected).toBe(false);
      expect(modeSelector.modes[1].selected).toBe(false);
    });

    it('selects the new mode and unselects the old one', function() {
      var modeSelector = helper.createModeSelector(session.desktop, 2);
      modeSelector.render();

      modeSelector.setSelectedMode(modeSelector.modes[0]);
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[0]);
      expect(modeSelector.modes[0].selected).toBe(true);
      expect(modeSelector.modes[1].selected).toBe(false);

      modeSelector.setSelectedMode(modeSelector.modes[1]);
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[1]);
      expect(modeSelector.modes[0].selected).toBe(false);
      expect(modeSelector.modes[1].selected).toBe(true);
    });

    it('is called when setting the mode directly', function() {
      var modeSelector = helper.createModeSelector(session.desktop, 2);
      modeSelector.render();

      modeSelector.modes[0].setSelected(true);
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[0]);
      expect(modeSelector.modes[0].selected).toBe(true);
      expect(modeSelector.modes[1].selected).toBe(false);

      modeSelector.modes[1].setSelected(true);
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[1]);
      expect(modeSelector.modes[0].selected).toBe(false);
      expect(modeSelector.modes[1].selected).toBe(true);
    });

    it('triggers a property change event', function() {
      var modeSelector = helper.createModeSelector(session.desktop, 2);
      modeSelector.render();
      var triggeredEvent = null;
      var eventCount = 0;
      modeSelector.on('propertyChange', function(event) {
        if (event.propertyName === 'selectedMode') {
          triggeredEvent = event;
          eventCount++;
        }
      });
      modeSelector.modes[0].setSelected(true);
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[0]);
      expect(modeSelector.modes[0].selected).toBe(true);
      expect(modeSelector.modes[1].selected).toBe(false);
      expect(triggeredEvent.newValue).toBe(modeSelector.modes[0]);
      expect(eventCount).toBe(1);

      modeSelector.modes[1].setSelected(true);
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[1]);
      expect(modeSelector.modes[0].selected).toBe(false);
      expect(modeSelector.modes[1].selected).toBe(true);
      expect(triggeredEvent.newValue).toBe(modeSelector.modes[1]);
      expect(eventCount).toBe(2);
    });

    it('makes sure only one mode is selected even if multiple modes are selected during init', function() {
      var modeSelector = scout.create('ModeSelector', {
        parent: session.desktop,
        modes: [{
          objectType: 'Mode',
          selected: true
        }, {
          objectType: 'Mode',
          selected: true
        }]
      });
      // Only the second button should be selected
      expect(modeSelector.selectedMode).toBe(modeSelector.modes[1]);
      expect(modeSelector.modes[0].selected).toBe(false);
      expect(modeSelector.modes[1].selected).toBe(true);
    });
  });
});

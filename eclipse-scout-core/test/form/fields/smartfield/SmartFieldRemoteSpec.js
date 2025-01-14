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
import {QueryBy, RemoteEvent, scout, SmartField, Status} from '../../../../src/index';
import {FormSpecHelper} from '../../../../src/testing/index';

/* global linkWidgetAndAdapter */
describe('SmartFieldRemote', function() {

  // This spec contains test that use the SmartFieldAdapter (= remote case)

  var session, helper;

  beforeEach(function() {
    setFixtures(sandbox());
    session = sandboxSession();
    helper = new FormSpecHelper(session);
    jasmine.Ajax.install();
    jasmine.clock().install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
    jasmine.clock().uninstall();
    removePopups(session);
    removePopups(session, '.touch-popup');
  });

  function createSmartFieldWithAdapter() {
    var model = helper.createFieldModel('SmartField');
    var smartField = new SmartField();
    smartField.init(model);
    linkWidgetAndAdapter(smartField, 'SmartFieldAdapter');
    return smartField;
  }

  describe('openPopup', function() {
    var events = [null],
      smartField;

    beforeEach(function() {
      smartField = createSmartFieldWithAdapter();
      smartField.render();
      smartField.$field.val('foo');
      smartField.remoteHandler = function(event, delay) {
        events[0] = event;
      };
    });

    it('must "browse all" when field is valid and browse parameter is true', function() {
      smartField.openPopup(true);
      sendQueuedAjaxCalls();
      var expectedEvent = new RemoteEvent(smartField.id, 'lookupByAll', {
        showBusyIndicator: false
      });
      expect(mostRecentJsonRequest()).toContainEvents([expectedEvent]);
    });

    it('must "lookup by text" when called without arguments and display-text is not empty', function() {
      smartField.openPopup();
      jasmine.clock().tick(500); // because we use a debounce in SmartField
      sendQueuedAjaxCalls();
      var expectedEvent = new RemoteEvent(smartField.id, 'lookupByText', {
        showBusyIndicator: false,
        text: 'foo'
      });
      expect(mostRecentJsonRequest()).toContainEvents([expectedEvent]);
    });

    it('must "lookup by text" when error status is NOT_UNIQUE, even though the browse parameter is true', function() {
      smartField.errorStatus = Status.error({
        message: 'bar',
        code: SmartField.ErrorCode.NOT_UNIQUE
      });
      smartField.openPopup(true);
      jasmine.clock().tick(500); // because we use a debounce in SmartField
      sendQueuedAjaxCalls();
      var expectedEvent = new RemoteEvent(smartField.id, 'lookupByText', {
        showBusyIndicator: false,
        text: 'foo'
      });
      expect(mostRecentJsonRequest()).toContainEvents([expectedEvent]);
    });
  });

  describe('acceptInput', function() {
    var smartField;

    beforeEach(function() {
      smartField = createSmartFieldWithAdapter();
    });

    it('must set displayText', function() {
      smartField.render();
      smartField.$field.val('foo');
      smartField.acceptInput();
      expect(smartField.displayText).toBe('foo');
    });

    it('must call clearTimeout() for pending lookups', function() {
      smartField.render();
      smartField._pendingLookup = null;
      smartField.$field.val('bar');
      smartField._lookupByTextOrAll();
      expect(smartField._pendingLookup).toBeTruthy();
      smartField.acceptInput();
      expect(smartField._pendingLookup).toBe(null);
    });

    it('don\'t send acceptInput event when display-text has not changed', function() {
      smartField._lastSearchText = 'foo';
      smartField.render();
      smartField.$field.val('foo');
      smartField.acceptInput();

      sendQueuedAjaxCalls();
      expect(jasmine.Ajax.requests.count()).toBe(0);
    });

    it('send acceptInput event when lookup row is set and display-text has not changed', function() {
      var lookupRow = scout.create('LookupRow', {
        key: 123,
        text: 'foo'
      }, {
        ensureUniqueId: false
      });

      smartField._lastSearchText = 'foo';
      smartField.render();
      smartField.$field.val('foo');
      smartField.popup = scout.create('SmartFieldPopup', {
        parent: smartField,
        lookupResult: {
          seqNo: 0, // must match smartField.lookupSeqNo
          lookupRows: [lookupRow]
        }
      });
      smartField.acceptInput();

      sendQueuedAjaxCalls();
      var expectedEvent = new RemoteEvent(smartField.id, 'acceptInput', {
        value: 123,
        displayText: 'foo',
        errorStatus: null,
        lookupRow: {
          objectType: 'LookupRow',
          key: 123,
          text: 'foo',
          parentKey: null,
          active: true,
          enabled: true,
          additionalTableRowData: null,
          cssClass: null,
          iconId: null,
          tooltipText: null,
          backgroundColor: null,
          foregroundColor: null,
          font: null
        },
        showBusyIndicator: true
      });
      expect(mostRecentJsonRequest()).toContainEvents([expectedEvent]);
    });

    it('do a "lookup by text" when display-text has changed and no lookup row is set', function() {
      smartField.displayText = 'foo';
      smartField.render();
      // simulate the user has typed some text. Normally this would be done in _onFieldKeyDown/Up
      // since we don't want to work with key-event in this test, we must set the _userWasTyping flag manually
      smartField.$field.val('bar');
      smartField._userWasTyping = true;
      // --- end of simulation ---
      smartField.acceptInput();

      sendQueuedAjaxCalls();
      var expectedEvent = new RemoteEvent(smartField.id, 'lookupByText', {
        text: 'bar',
        showBusyIndicator: false
      });
      expect(mostRecentJsonRequest()).toContainEvents([expectedEvent]);
    });

  });

  describe('touch mode', function() {
    var smartField;

    beforeEach(function() {
      smartField = createSmartFieldWithAdapter();
    });

    function resolveLookupCall(lookupCall) {
      lookupCall.resolveLookup({
        queryBy: QueryBy.ALL,
        lookupRows: [scout.create('LookupRow', {
          key: 123,
          text: 'foo'
        })]
      });
      jasmine.clock().tick(500);
    }

    it('opens a touch popup when smart field gets touched', function() {
      var lookupCallClone = null;
      smartField.touchMode = true;
      smartField.render();
      smartField.on('prepareLookupCall', function(event) {
        lookupCallClone = event.lookupCall;
      });

      smartField.$field.triggerClick();
      resolveLookupCall(lookupCallClone);
      expect(smartField.popup.rendered).toBe(true);
      expect($('.touch-popup').length).toBe(1);
      expect($('.smart-field-popup').length).toBe(0);

      smartField.popup.close();
      expect(smartField.popup).toBe(null);
      expect($('.touch-popup').length).toBe(0);
      expect($('.smart-field-popup').length).toBe(0);

      // Expect same behavior after a second click
      smartField.$field.triggerClick();
      resolveLookupCall(lookupCallClone);
      expect(smartField.popup.rendered).toBe(true);
      expect($('.touch-popup').length).toBe(1);
      expect($('.smart-field-popup').length).toBe(0);
      smartField.popup.close();
    });

    it('shows smartfield with same text as clicked smartfield', function() {
      var lookupCallClone = null;
      smartField.touchMode = true;
      smartField.displayText = 'row 1';
      smartField.render();
      smartField.on('prepareLookupCall', function(event) {
        lookupCallClone = event.lookupCall;
      });
      smartField.$field.triggerClick();
      resolveLookupCall(lookupCallClone);
      expect(smartField.popup.rendered).toBe(true);
      expect(smartField.popup._field.displayText).toBe(smartField.displayText);
      expect(smartField.popup._field.$field.val()).toBe(smartField.displayText);
      smartField.popup.close();
    });

  });

});

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
import {Device, scout, Status} from '../../../../src/index';
import {FormSpecHelper} from '../../../../src/testing/index';

describe('FileChooserField', function() {
  var session;
  var helper;

  beforeEach(function() {
    setFixtures(sandbox());
    session = sandboxSession();
    helper = new FormSpecHelper(session);
    jasmine.Ajax.install();
    jasmine.clock().install();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
    jasmine.Ajax.uninstall();
  });

  describe('setValue', function() {
    var field;

    beforeEach(function() {
      field = helper.createField('FileChooserField');
    });

    it('sets the file as value', function() {
      if (!Device.get().supportsFileConstructor()) {
        return;
      }
      var file = new File(['lorem'], 'ipsum.txt');
      field.render();
      field.setValue(file);
      expect(field.value).toBe(file);
      expect(field.displayText).toBe('ipsum.txt');
    });

    it('sets no file as value', function() {
      field.render();
      field.setValue(null);
      expect(field.value).toBe(null);
      expect(field.displayText).toBe('');
    });

    // Test for ticket #288702. Value had wrong type 'string' after clear() has been called.
    // Thus an error status has been displayed for no reason.
    it('uses proper value type after clear() has been called', () => {
      field.render();
      field.setDisplayText('unicorn-website-design.zip');
      expect(field.errorStatus).toBe(null);
      field.clear();
      expect(field.errorStatus).toBe(null);
    });
  });

  describe('maximumUploadSize', function() {

    it('is validated when setting new value', function() {
      if (!Device.get().supportsFileConstructor()) {
        return;
      }
      var smallFile = new File(['a'], 'small file.txt');
      var largeFile = new File(['abcdefghijklmnopqrstuvwxyz'], 'large file.txt');
      var largerFile = new File(['abcdefghijklmnopqrstuvwxyz0123456789'], 'larger file.txt');

      var field = helper.createField('FileChooserField');
      field.setMaximumUploadSize(5); // 5 bytes

      field.setValue(largeFile);
      expect(field.errorStatus instanceof Status).toBe(true);
      expect(field.value).toBe(null);

      field.setValue(smallFile);
      expect(field.errorStatus).toBe(null);
      expect(field.value).toBe(smallFile);

      field.setValue(largerFile);
      expect(field.errorStatus instanceof Status).toBe(true);
      expect(field.value).toBe(smallFile);
    });

    it('is not validated when changing maximumUploadSize', function() {
      if (!Device.get().supportsFileConstructor()) {
        return;
      }
      var largeFile = new File(['abcdefghijklmnopqrstuvwxyz'], 'large file.txt');

      var field = helper.createField('FileChooserField');
      field.setValue(largeFile);
      expect(field.errorStatus).toBe(null);
      expect(field.value).toBe(largeFile);

      field.setMaximumUploadSize(10);
      expect(field.errorStatus).toBe(null);
      expect(field.value).toBe(largeFile);
    });
  });

  describe('label', function() {

    it('is linked with the field', function() {
      var field = scout.create('FileChooserField', {
        parent: session.desktop,
        label: 'label'
      });
      field.render();
      expect(field.$field.attr('aria-labelledby')).toBeTruthy();
      expect(field.$field.attr('aria-labelledby')).toBe(field.$label.attr('id'));
    });

    it('focuses the field when clicked', function() {
      var field = scout.create('FileChooserField', {
        parent: session.desktop,
        label: 'label'
      });
      field.render();
      field.$label.triggerClick();
      expect(field.$field).toBeFocused();
    });

  });

});

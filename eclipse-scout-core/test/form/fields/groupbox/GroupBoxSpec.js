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
import {DialogLayout, FormField, GroupBox, HorizontalGrid, scout, VerticalSmartGrid} from '../../../../src/index';
import {FormSpecHelper} from '../../../../src/testing/index';

describe('GroupBox', function() {
  var session;
  var helper;

  beforeEach(function() {
    setFixtures(sandbox());
    session = sandboxSession();
    helper = new FormSpecHelper(session);
  });

  function createField(model, parent) {
    var field = new GroupBox();
    model.session = session;
    model.parent = parent || session.desktop;
    field.init(model);
    return field;
  }

  function expectEnabled(field, expectedEnabled, expectedEnabledComputed, hasClass) {
    expect(field.enabled).toBe(expectedEnabled);
    expect(field.enabledComputed).toBe(expectedEnabledComputed);
    if (hasClass) {
      if (field.$field) {
        expect(field.$field).toHaveClass(hasClass);
      } else {
        expect(field.$container).toHaveClass(hasClass);
      }
    }
  }

  describe('_render', function() {

    it('adds group-box div when label is set', function() {
      var model = {
        id: '2',
        label: 'fooBar',
        gridDataHints: {
          x: 0,
          y: 0
        }
      };
      var groupBox = createField(model);
      groupBox.render($('#sandbox'));
      expect($('#sandbox')).toContainElement('div.group-box');
      expect($('#sandbox')).toContainElement('div.group-box-title');
    });

    it('renders controls initially if expanded', function() {
      var groupBox = helper.createGroupBoxWithOneField(session.desktop);
      spyOn(groupBox, '_renderControls');
      groupBox.render();
      expect(groupBox._renderControls.calls.count()).toEqual(1);
    });

    it('does not render controls initially if collapsed, but on expand', function() {
      var groupBox = helper.createGroupBoxWithOneField(session.desktop);
      spyOn(groupBox, '_renderControls');
      groupBox.setExpanded(false);
      groupBox.render();
      expect(groupBox._renderControls.calls.count()).toEqual(0);
      groupBox.setExpanded(true);
      expect(groupBox._renderControls.calls.count()).toEqual(1);
    });

    it('automatically hides the label if it is empty', function() {
      // Test 1: render first
      var groupBox = createField({});
      groupBox.render();

      expect(groupBox.labelVisible).toBe(true);
      expect(groupBox._computeTitleVisible()).toBe(false);
      expect(groupBox.$title.isVisible()).toBe(false);
      groupBox.setLabel('test');
      expect(groupBox.labelVisible).toBe(true);
      expect(groupBox._computeTitleVisible()).toBe(true);
      expect(groupBox.$title.isVisible()).toBe(true);
      expect(groupBox.$title.text().trim()).toBe('test');
      groupBox.setLabelVisible(false);
      expect(groupBox.labelVisible).toBe(false);
      expect(groupBox._computeTitleVisible()).toBe(false);
      expect(groupBox.$title.isVisible()).toBe(false);
      expect(groupBox.$title.text().trim()).toBe('test');

      // Test 2: render later
      var groupBox2 = createField({});
      expect(groupBox2.labelVisible).toBe(true);
      expect(groupBox2._computeTitleVisible()).toBe(false);
      groupBox2.setLabel('test2');
      expect(groupBox2.labelVisible).toBe(true);
      expect(groupBox2._computeTitleVisible()).toBe(true);
      groupBox2.render();
      expect(groupBox2.$title.isVisible()).toBe(true);
      expect(groupBox2.$title.text().trim()).toBe('test2');

      // Cleanup
      groupBox.destroy();
      groupBox2.destroy();
    });
  });

  describe('focus', function() {
    it('focuses the first field', function() {
      var box = scout.create('GroupBox', {
        parent: session.desktop,
        fields: [{
          objectType: 'StringField'
        }, {
          objectType: 'StringField'
        }]
      });
      box.render();
      expect(box.fields[0].$field).not.toBeFocused();

      box.focus();
      expect(box.fields[0].$field).toBeFocused();
    });

    it('focuses the second field if the first is disabled', function() {
      var box = scout.create('GroupBox', {
        parent: session.desktop,
        fields: [{
          objectType: 'StringField',
          enabled: false
        }, {
          objectType: 'StringField',
          enabled: true
        }]
      });
      box.render();
      expect(box.fields[1].$field).not.toBeFocused();

      box.focus();
      expect(box.fields[1].$field).toBeFocused();
    });

    it('focuses the second field if the first not focusable', function() {
      var box = scout.create('GroupBox', {
        parent: session.desktop,
        fields: [{
          objectType: 'LabelField'
        }, {
          objectType: 'StringField'
        }]
      });
      box.render();
      expect(box.fields[1].$field).not.toBeFocused();

      box.focus();
      expect(box.fields[1].$field).toBeFocused();
    });

    it('considers child group boxes', function() {
      var box = scout.create('GroupBox', {
        parent: session.desktop,
        fields: [{
          objectType: 'GroupBox',
          fields: [{
            objectType: 'LabelField'
          }, {
            objectType: 'StringField'
          }]
        }]
      });
      box.render();
      expect(box.fields[0].fields[1].$field).not.toBeFocused();

      box.focus();
      expect(box.fields[0].fields[1].$field).toBeFocused();
    });
  });

  describe('default values', function() {

    it('gridDataHints', function() {
      var groupBox = helper.createGroupBoxWithOneField(session.desktop);
      var gdh = groupBox.gridDataHints;
      expect(gdh.useUiHeight).toBe(true);
      expect(gdh.w).toBe(FormField.FULL_WIDTH);
    });

  });

  describe('enabled', function() {
    it('is not propagated to children by default', function() {
      var groupBoxWithTwoChildren = helper.createGroupBoxWithFields(session.desktop, 2);
      groupBoxWithTwoChildren.render();

      expectEnabled(groupBoxWithTwoChildren, true, true);
      expectEnabled(groupBoxWithTwoChildren.getFields()[0], true, true);
      expectEnabled(groupBoxWithTwoChildren.getFields()[1], true, true);

      groupBoxWithTwoChildren.setEnabled(false);
      expectEnabled(groupBoxWithTwoChildren, false, false, 'disabled');
      expectEnabled(groupBoxWithTwoChildren.getFields()[0], true, false, 'disabled');
      expectEnabled(groupBoxWithTwoChildren.getFields()[1], true, false, 'disabled');
    });

    it('but maybe propagated to children if required', function() {
      var groupBoxWithTwoChildren = helper.createGroupBoxWithFields(session.desktop, 2);
      groupBoxWithTwoChildren.render();

      expectEnabled(groupBoxWithTwoChildren, true, true);
      expectEnabled(groupBoxWithTwoChildren.getFields()[0], true, true);
      expectEnabled(groupBoxWithTwoChildren.getFields()[1], true, true);

      groupBoxWithTwoChildren.setEnabled(false, true, true);
      expectEnabled(groupBoxWithTwoChildren, false, false, 'disabled');
      expectEnabled(groupBoxWithTwoChildren.getFields()[0], false, false, 'disabled');
      expectEnabled(groupBoxWithTwoChildren.getFields()[1], false, false, 'disabled');

      groupBoxWithTwoChildren.getFields()[0].setEnabled(true, true, true);
      expectEnabled(groupBoxWithTwoChildren, true, true);
      expectEnabled(groupBoxWithTwoChildren.getFields()[0], true, true);
      expectEnabled(groupBoxWithTwoChildren.getFields()[1], false, false);
    });
  });

  describe('logical grid', function() {
    it('is validated automatically by the logical grid layout', function() {
      var groupBox = scout.create('GroupBox', {
        parent: session.desktop,
        gridColumnCount: 2,
        fields: [
          {
            objectType: 'StringField'
          },
          {
            objectType: 'StringField'
          },
          {
            objectType: 'StringField'
          }
        ]
      });
      groupBox.render();
      expect(groupBox.fields[0].gridData.x).toBe(-1);
      expect(groupBox.fields[0].gridData.y).toBe(-1);
      expect(groupBox.fields[1].gridData.x).toBe(-1);
      expect(groupBox.fields[1].gridData.y).toBe(-1);
      expect(groupBox.fields[2].gridData.x).toBe(-1);
      expect(groupBox.fields[2].gridData.y).toBe(-1);

      // Logical grid will be validated along with the layout
      groupBox.revalidateLayout();
      expect(groupBox.fields[0].gridData.x).toBe(0);
      expect(groupBox.fields[0].gridData.y).toBe(0);
      expect(groupBox.fields[1].gridData.x).toBe(0);
      expect(groupBox.fields[1].gridData.y).toBe(1);
      expect(groupBox.fields[2].gridData.x).toBe(1);
      expect(groupBox.fields[2].gridData.y).toBe(0);
    });

    it('will get dirty if a field gets invisible', function() {
      var groupBox = scout.create('GroupBox', {
        parent: session.desktop,
        gridColumnCount: 2,
        fields: [
          {
            objectType: 'StringField'
          },
          {
            objectType: 'StringField'
          },
          {
            objectType: 'StringField'
          }
        ]
      });
      groupBox.render();
      groupBox.revalidateLayout();

      groupBox.fields[2].setVisible(false);
      expect(groupBox.logicalGrid.dirty).toBe(true);

      groupBox.revalidateLayout();
      expect(groupBox.fields[0].gridData.x).toBe(0);
      expect(groupBox.fields[0].gridData.y).toBe(0);
      expect(groupBox.fields[1].gridData.x).toBe(1);
      expect(groupBox.fields[1].gridData.y).toBe(0);
    });

    it('may be specified using the object type', function() {
      var groupBox = scout.create('GroupBox', {
        parent: session.desktop,
        logicalGrid: 'HorizontalGrid'
      });
      expect(groupBox.logicalGrid instanceof HorizontalGrid).toBe(true);

      groupBox = scout.create('GroupBox', {
        parent: session.desktop,
        logicalGrid: 'VerticalSmartGrid'
      });
      expect(groupBox.logicalGrid instanceof VerticalSmartGrid).toBe(true);

      groupBox = scout.create('GroupBox', {
        parent: session.desktop,
        logicalGrid: scout.create('HorizontalGrid')
      });
      expect(groupBox.logicalGrid instanceof HorizontalGrid).toBe(true);
    });

    it('uses widthInPixel and heightInPixel as dialog width and height if set on main box', function(done) {
      var $tmpStyle = $('<style type="text/css">.dialog { position: absolute; }</style>')
        .appendTo($('head'));

      // stub function because when running in phantom js the window has an unpredictable size, it seems to get smaller when adding new specs...
      spyOn(DialogLayout, 'fitContainerInWindow').and.callFake(function(windowSize, containerPosition, containerSize, containerMargins) {
        return containerSize;
      });

      var form = scout.create('Form', {
        parent: session.desktop,
        rootGroupBox: {
          objectType: 'GroupBox',
          gridDataHints: {
            widthInPixel: 27,
            heightInPixel: 30
          }
        }
      });
      form.open()
        .then(function() {
          expect(form.rootGroupBox.$container.cssHeight()).toBe(30);
          expect(form.rootGroupBox.$container.cssWidth()).toBe(27);
          form.close();
          $tmpStyle.remove();
        })
        .catch(fail)
        .always(done);
    });
  });

  describe('scrollable', function() {
    it('null by default', function() {
      var groupBox = scout.create('GroupBox', {
        parent: session.desktop
      });
      expect(groupBox.scrollable).toBe(null);
    });

    it('is set to true if it is a mainbox', function() {
      var groupBox = scout.create('GroupBox', {
        parent: session.desktop,
        mainBox: true
      });
      expect(groupBox.scrollable).toBe(true);

      groupBox = scout.create('GroupBox', {
        parent: session.desktop
      });
      expect(groupBox.scrollable).toBe(null);

      groupBox.setMainBox(true);
      expect(groupBox.scrollable).toBe(true);
    });

    it('is not set to true if it is a mainbox but explicitly set to false', function() {
      var groupBox = scout.create('GroupBox', {
        parent: session.desktop,
        mainBox: true,
        scrollable: false
      });
      expect(groupBox.scrollable).toBe(false);

      groupBox = scout.create('GroupBox', {
        parent: session.desktop,
        mainBox: true
      });
      expect(groupBox.scrollable).toBe(true);

      groupBox.setScrollable(false);
      expect(groupBox.scrollable).toBe(false);

      groupBox = scout.create('GroupBox', {
        parent: session.desktop
      });
      expect(groupBox.scrollable).toBe(null);

      groupBox.setScrollable(false);
      expect(groupBox.scrollable).toBe(false);

      groupBox.setMainBox(true);
      expect(groupBox.scrollable).toBe(false);
    });
  });

  describe('insertField', function() {
    it('inserts the field at the given index', function() {
      var groupBox = helper.createGroupBoxWithFields(session.desktop, 2);
      expect(groupBox.fields.length).toBe(2);
      expect(groupBox.controls.length).toBe(2);

      var newField = scout.create('StringField', {parent: groupBox});
      groupBox.insertField(newField, 1);
      expect(groupBox.fields.length).toBe(3);
      expect(groupBox.controls.length).toBe(3);
      expect(groupBox.fields[1]).toBe(newField);
      expect(groupBox.controls[1]).toBe(newField);

      // At the beginning
      var newField2 = scout.create('StringField', {parent: groupBox});
      groupBox.insertField(newField2, 0);
      expect(groupBox.fields.length).toBe(4);
      expect(groupBox.controls.length).toBe(4);
      expect(groupBox.fields[0]).toBe(newField2);
      expect(groupBox.controls[0]).toBe(newField2);

      // At the end
      var newField3 = scout.create('StringField', {parent: groupBox});
      groupBox.insertField(newField3, 4);
      expect(groupBox.fields.length).toBe(5);
      expect(groupBox.controls.length).toBe(5);
      expect(groupBox.fields[4]).toBe(newField3);
      expect(groupBox.controls[4]).toBe(newField3);
    });

    it('inserts the field at the end if no index is provided', function() {
      var groupBox = helper.createGroupBoxWithFields(session.desktop, 2);
      expect(groupBox.fields.length).toBe(2);
      expect(groupBox.controls.length).toBe(2);

      var newField = scout.create('StringField', {parent: groupBox});
      groupBox.insertField(newField);
      expect(groupBox.fields.length).toBe(3);
      expect(groupBox.controls.length).toBe(3);
      expect(groupBox.fields[2]).toBe(newField);
      expect(groupBox.controls[2]).toBe(newField);
    });
  });

  describe('insertBefore', function() {
    it('inserts the field before the given other field', function() {
      var groupBox = helper.createGroupBoxWithFields(session.desktop, 2);
      expect(groupBox.fields.length).toBe(2);
      expect(groupBox.controls.length).toBe(2);

      var newField = scout.create('StringField', {parent: groupBox});
      var sibling = groupBox.fields[1];
      groupBox.insertFieldBefore(newField, sibling);
      expect(groupBox.fields.length).toBe(3);
      expect(groupBox.controls.length).toBe(3);
      expect(groupBox.fields[1]).toBe(newField);
      expect(groupBox.controls[1]).toBe(newField);
      expect(groupBox.fields[2]).toBe(sibling);
      expect(groupBox.controls[2]).toBe(sibling);

      // At the beginning
      var newField2 = scout.create('StringField', {parent: groupBox});
      sibling = groupBox.fields[0];
      groupBox.insertFieldBefore(newField2, sibling);
      expect(groupBox.fields.length).toBe(4);
      expect(groupBox.controls.length).toBe(4);
      expect(groupBox.fields[0]).toBe(newField2);
      expect(groupBox.controls[0]).toBe(newField2);
      expect(groupBox.fields[1]).toBe(sibling);
      expect(groupBox.controls[1]).toBe(sibling);
    });
  });

  describe('insertAfter', function() {
    it('inserts the field after the given other field', function() {
      var groupBox = helper.createGroupBoxWithFields(session.desktop, 2);
      expect(groupBox.fields.length).toBe(2);
      expect(groupBox.controls.length).toBe(2);

      var newField = scout.create('StringField', {parent: groupBox});
      var sibling = groupBox.fields[1];
      groupBox.insertFieldAfter(newField, sibling);
      expect(groupBox.fields.length).toBe(3);
      expect(groupBox.controls.length).toBe(3);
      expect(groupBox.fields[2]).toBe(newField);
      expect(groupBox.controls[2]).toBe(newField);
      expect(groupBox.fields[1]).toBe(sibling);
      expect(groupBox.controls[1]).toBe(sibling);

      // At the end
      var newField3 = scout.create('StringField', {parent: groupBox});
      sibling = groupBox.fields[2];
      groupBox.insertFieldAfter(newField, sibling);
      expect(groupBox.fields.length).toBe(4);
      expect(groupBox.controls.length).toBe(4);
      expect(groupBox.fields[3]).toBe(newField);
      expect(groupBox.controls[3]).toBe(newField);
      expect(groupBox.fields[2]).toBe(sibling);
      expect(groupBox.controls[2]).toBe(sibling);
    });
  });

});

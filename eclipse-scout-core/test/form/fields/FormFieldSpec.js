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
import {FormField, GridData, RadioButtonGroup, scout, Status, StringField, TreeVisitResult, Widget} from '../../../src/index';
import {FormSpecHelper} from '../../../src/testing/index';

describe('FormField', function() {
  var session;
  var helper;

  beforeEach(function() {
    setFixtures(sandbox());
    session = sandboxSession();
    helper = new FormSpecHelper(session);
  });

  function createFormField(model) {
    var formField = new FormField();
    formField._render = function() {
      this.addContainer(this.$parent, 'form-field');
      this.addLabel();
      this.addMandatoryIndicator();
      this.addField(this.$parent.makeDiv());
      this.addStatus();
    };
    formField.init(model);
    return formField;
  }

  describe('inheritance', function() {
    var formField, model;

    beforeEach(function() {
      model = helper.createFieldModel();
      formField = new FormField();
      formField.init(model);
    });

    it('inherits from Widget', function() {
      expect(Widget.prototype.isPrototypeOf(formField)).toBe(true);
    });

  });

  describe('_initProperty', function() {
    var formField, model;

    beforeEach(function() {
      model = helper.createFieldModel();
      formField = new FormField();
    });

    it('gridDataHints are extended (not replaced) on init when gridDataHints is a plain object', function() {
      var defaultGridDataHints = formField.gridDataHints;
      expect(defaultGridDataHints instanceof GridData).toBe(true);
      // expect one of the many default values of GridData
      expect(defaultGridDataHints.fillHorizontal).toBe(true);

      model.gridDataHints = {
        fillHorizontal: false
      };
      formField.init(model);

      // we expect to have still the same instance
      expect(defaultGridDataHints).toBe(formField.gridDataHints);
      // expect that the default gridDataHints property has been overridden with the property passed to the init function
      expect(formField.gridDataHints.fillHorizontal).toBe(false);
    });

    it('gridDataHints are replaced when gridDataHints is instanceof GridData', function() {
      var gridDataHints = new GridData();
      model.gridDataHints = gridDataHints;
      formField.init(model);
      expect(formField.gridDataHints).toBe(gridDataHints);
    });

  });

  describe('property label position', function() {
    var formField, model;

    beforeEach(function() {
      model = helper.createFieldModel();
      formField = new StringField();
      formField.init(model);
    });

    describe('position on_field', function() {

      beforeEach(function() {
        formField.label = 'labelName';
        formField.labelPosition = FormField.LabelPosition.ON_FIELD;
      });

      it('sets the label as placeholder', function() {
        formField.render();
        expect(formField.$label.html()).toBeFalsy();
        expect(formField.$field.attr('placeholder')).toBe(formField.label);
      });

      it('does not call field._renderLabelPosition initially', function() {
        formField.render();
        expect(formField.$label.html()).toBeFalsy();
        expect(formField.$field.attr('placeholder')).toBe(formField.label);

        spyOn(formField, '_renderLabelPosition');
        expect(formField._renderLabelPosition).not.toHaveBeenCalled();
      });

    });

    describe('position top', function() {

      beforeEach(function() {
        formField.label = 'labelName';
        formField.labelPosition = FormField.LabelPosition.TOP;
      });

      it('guarantees a minimum height if label is empty', function() {
        formField.label = '';
        formField.render();
        expect(formField.$label.html()).toBe('&nbsp;');
        expect(formField.$label).toBeVisible();
      });

    });

    it('does not display a status if status visible = false', function() {
      formField.statusVisible = false;
      formField.render();

      expect(formField.$status.isVisible()).toBe(false);
    });

  });

  describe('disabled style read-only', function() {

    var formField;

    beforeEach(function() {
      formField = helper.createField('StringField', session.desktop);
    });

    it('sets css class \'read-only\' when field is disabled and setDisabledStyle has been called ', function() {
      formField.render();
      formField.setDisabledStyle(Widget.DisabledStyle.READ_ONLY);
      formField.setEnabled(false);
      expect(formField.$field.attr('class')).toContain('read-only');
      formField.setEnabled(true);
      expect(formField.$field.attr('class')).not.toContain('read-only');
    });

  });

  describe('property tooltipText', function() {
    var formField, model;

    beforeEach(function() {
      model = helper.createFieldModel();
      formField = createFormField(model);
    });

    it('adds class has-tooltip if there is a tooltip text', function() {
      formField.tooltipText = 'hello';
      formField.render();
      expect(formField.$container).toHaveClass('has-tooltip');

      formField.setTooltipText(null);
      expect(formField.$container).not.toHaveClass('has-tooltip');
    });

  });

  describe('property tooltipAnchor', function() {
    var formField, model;

    beforeEach(function() {
      model = helper.createFieldModel();
      formField = createFormField(model);
    });

    it('hasStatusTooltip / hasOnFieldTooltip', function() {
      expect(formField.tooltipText).toBeFalsy();
      expect(formField.hasStatusTooltip()).toBe(false);
      expect(formField.hasOnFieldTooltip()).toBe(false);

      formField.setTooltipText('foo');
      expect(formField.hasStatusTooltip()).toBe(true);
      expect(formField.hasOnFieldTooltip()).toBe(false);

      formField.setTooltipAnchor(FormField.TooltipAnchor.ON_FIELD);
      expect(formField.hasStatusTooltip()).toBe(false);
      expect(formField.hasOnFieldTooltip()).toBe(true);
    });

    it('show tooltip on status-icon click or on on-field hover', function() {
      formField.render();
      formField.setTooltipText('foo');

      // expect a status-icon
      expect(formField.$field.hasClass('has-tooltip')).toBe(true);

      // expect status-icon to become invisible
      formField.setTooltipAnchor(FormField.TooltipAnchor.ON_FIELD);
      expect(formField.$field.hasClass('has-tooltip')).toBe(false);
    });

  });

  describe('property menus', function() {
    var formField, model;

    beforeEach(function() {
      model = helper.createFieldModel();
      formField = createFormField(model);
    });

    it('ensures this.menus is not null', function() {
      var menu = scout.create('Menu', {
        parent: formField
      });
      formField.setMenus([menu]);
      expect(formField.menus).toBeDefined();
      expect(formField.menus.length).toBe(1);

      formField.setMenus(null);
      expect(formField.menus).toBeDefined();
      expect(formField.menus.length).toBe(0);
    });

    it('adds class has-menus if there are menus', function() {
      var menu = scout.create('Menu', {
        parent: formField
      });
      formField.setMenusVisible(true);
      formField.setMenus([menu]);
      formField.render();
      expect(formField.$container).toHaveClass('has-menus');

      formField.setMenus([]);
      expect(formField.$container).not.toHaveClass('has-menus');
    });

    it('adds class has-menus has-tooltip if there are menus and a tooltip', function() {
      var menu = scout.create('Menu', {
        parent: formField
      });
      formField.setMenusVisible(true);
      formField.setMenus([menu]);
      formField.setTooltipText('hello');
      formField.render();
      expect(formField.$container).toHaveClass('has-menus');
      expect(formField.$container).toHaveClass('has-tooltip');

      formField.setMenus([]);
      formField.setTooltipText(null);
      expect(formField.$container).not.toHaveClass('has-menus');
      expect(formField.$container).not.toHaveClass('has-tooltip');
    });

    it('toggles has-menus class when visibility changes', function() {
      var menu = scout.create('Menu', {
        parent: formField
      });
      formField.setMenus([menu]);
      formField.render();
      expect(formField.$container).toHaveClass('has-menus');

      menu.setVisible(false);
      expect(formField.$container).not.toHaveClass('has-menus');

      menu.setVisible(true);
      expect(formField.$container).toHaveClass('has-menus');

      formField.setMenusVisible(false);
      expect(formField.$container).not.toHaveClass('has-menus');

      menu.setVisible(false);
      formField.setMenusVisible(true);
      expect(formField.$container).not.toHaveClass('has-menus');

      var menu2 = scout.create('Menu', {
        parent: formField
      });
      formField.setMenus([menu, menu2]);
      expect(formField.$container).toHaveClass('has-menus');

      menu.setVisible(true);
      formField.setMenus([menu]);
      expect(formField.$container).toHaveClass('has-menus');
      menu2.setVisible(false); // check that listener is detached
      expect(formField.$container).toHaveClass('has-menus');
    });

    it('updates menus on status when visibility changes', function() {
      var menu = scout.create('Menu', {
        parent: formField
      });
      var menu2 = scout.create('Menu', {
        parent: formField,
        visible: false
      });
      formField.setMenus([menu, menu2]);
      formField.render();
      expect(formField.menus).toEqual([menu, menu2]);
      expect(formField.fieldStatus.menus).toEqual([menu]);

      formField.fieldStatus.showContextMenu();
      expect(formField.fieldStatus.contextMenu.$visibleMenuItems().length).toBe(1);
      formField.fieldStatus.hideContextMenu();

      menu2.setVisible(true);
      expect(formField.menus).toEqual([menu, menu2]);
      expect(formField.fieldStatus.menus).toEqual([menu, menu2]);

      formField.fieldStatus.showContextMenu();
      expect(formField.fieldStatus.contextMenu.$visibleMenuItems().length).toBe(2);
      formField.fieldStatus.hideContextMenu();
    });
  });

  describe('property status visible', function() {
    var formField, model;

    beforeEach(function() {
      model = helper.createFieldModel();
      formField = createFormField(model);
    });

    it('shows a status if status visible = true', function() {
      formField.statusVisible = true;
      formField.render();

      expect(formField.$status.isVisible()).toBe(true);
    });

    it('does not show a status if status visible = false', function() {
      formField.statusVisible = false;
      formField.render();

      expect(formField.$status.isVisible()).toBe(false);
    });

    it('shows a status even though status visible is false but tooltipText is set', function() {
      formField.statusVisible = false;
      formField.tooltipText = 'hello';
      formField.render();

      expect(formField.$status.isVisible()).toBe(true);
      formField.setTooltipText(null);
      expect(formField.$status.isVisible()).toBe(false);
    });

    it('shows a status even though status visible is false but errorStatus is set', function() {
      formField.statusVisible = false;
      formField.errorStatus = new Status({
        message: 'error',
        severity: Status.Severity.ERROR
      });
      formField.render();

      expect(formField.$status.isVisible()).toBe(true);
      formField.setErrorStatus(null);
      expect(formField.$status.isVisible()).toBe(false);
    });

  });

  describe('property visible', function() {
    var formField, model;

    beforeEach(function() {
      model = helper.createFieldModel();
      formField = createFormField(model);
    });

    it('shows the field if visible = true', function() {
      formField.visible = true;
      formField.render();

      expect(formField.$container.isVisible()).toBe(true);
    });

    it('does not show the field if visible = false', function() {
      formField.visible = false;
      formField.render();

      expect(formField.$container.isVisible()).toBe(false);
    });

    it('hides the status message if field is made invisible', function() {
      formField.errorStatus = new Status({
        message: 'error',
        severity: Status.Severity.ERROR
      });
      formField.render();

      expect(formField.$container.isVisible()).toBe(true);
      expect(formField._tooltip().rendered).toBe(true);
      expect($('.tooltip').length).toBe(1);

      formField.setVisible(false);
      expect(formField._tooltip()).toBe(null);
      expect($('.tooltip').length).toBe(0);
    });

    it('shows the status message if field is made visible', function() {
      formField.errorStatus = new Status({
        message: 'error',
        severity: Status.Severity.ERROR
      });
      formField.visible = false;
      formField.render();

      expect(formField.$container.isVisible()).toBe(false);
      expect(formField._tooltip()).toBe(null);
      expect($('.tooltip').length).toBe(0);

      formField.setVisible(true);
      expect(formField._tooltip().rendered).toBe(true);
      expect($('.tooltip').length).toBe(1);
    });

  });

  function createVisitStructure() {
    var groupBox = scout.create('GroupBox', {
      parent: session.desktop,
      fields: [{
        objectType: 'StringField'
      }, {
        objectType: 'CheckBoxField'
      }, {
        objectType: 'GroupBox',
        toSkip: true,
        fields: [{
          objectType: 'StringField'
        }, {
          objectType: 'RadioButtonGroup',
          fields: [{
            objectType: 'RadioButton'
          }, {
            objectType: 'RadioButton',
            selected: true
          }]
        }]
      }, {
        objectType: 'GroupBox',
        fields: [{
          objectType: 'StringField'
        }]
      }],
      responsive: true
    });
    return groupBox;
  }

  function expectVisited(field) {
    expect(field.hasBeenVisited).toBeTruthy();
  }

  function expectNotVisited(field) {
    expect(field.hasBeenVisited).toBeFalsy();
  }

  describe('visitFields', function() {
    it('visits each field', function() {
      var groupBox = createVisitStructure();
      groupBox.visitFields(function(field) {
        field.hasBeenVisited = true;
      });

      expectVisited(groupBox);
      expectVisited(groupBox.fields[0]);
      expectVisited(groupBox.fields[1]);
      expectVisited(groupBox.fields[2]);
      expectVisited(groupBox.fields[2].fields[0]);
      expectVisited(groupBox.fields[2].fields[1]);
      expectVisited(groupBox.fields[2].fields[1].fields[0]);
      expectVisited(groupBox.fields[2].fields[1].fields[1]);
      expectVisited(groupBox.fields[3]);
      expectVisited(groupBox.fields[3].fields[0]);
    });

    it('can skip subtree of a group box when returning TreeVisitResult.SKIP_SUBTREE', function() {
      var groupBox = createVisitStructure();
      groupBox.visitFields(function(field) {
        field.hasBeenVisited = true;
        if (field.toSkip) {
          return TreeVisitResult.SKIP_SUBTREE;
        }
        return TreeVisitResult.CONTINUE;
      });

      expectVisited(groupBox);
      expectVisited(groupBox.fields[0]);
      expectVisited(groupBox.fields[1]);
      expectVisited(groupBox.fields[2]);
      expectNotVisited(groupBox.fields[2].fields[0]);
      expectNotVisited(groupBox.fields[2].fields[1]);
      expectNotVisited(groupBox.fields[2].fields[1].fields[0]);
      expectNotVisited(groupBox.fields[2].fields[1].fields[1]);
      expectVisited(groupBox.fields[3]);
      expectVisited(groupBox.fields[3].fields[0]);
    });

    it('can skip subtree of radio button group when returning TreeVisitResult.SKIP_SUBTREE', function() {
      var groupBox = createVisitStructure();
      groupBox.visitFields(function(field) {
        field.hasBeenVisited = true;
        if (field instanceof RadioButtonGroup) {
          return TreeVisitResult.SKIP_SUBTREE;
        }
        return TreeVisitResult.CONTINUE;
      });

      expectVisited(groupBox);
      expectVisited(groupBox.fields[0]);
      expectVisited(groupBox.fields[1]);
      expectVisited(groupBox.fields[2]);
      expectVisited(groupBox.fields[2].fields[0]);
      expectVisited(groupBox.fields[2].fields[1]);
      expectNotVisited(groupBox.fields[2].fields[1].fields[0]);
      expectNotVisited(groupBox.fields[2].fields[1].fields[1]);
      expectVisited(groupBox.fields[3]);
      expectVisited(groupBox.fields[3].fields[0]);
    });

    it('can terminate visiting by returning TreeVisitResult.TERMINATE', function() {
      var groupBox = createVisitStructure();
      groupBox.visitFields(function(field) {
        field.hasBeenVisited = true;
        if (field.toSkip) {
          return TreeVisitResult.TERMINATE;
        }
        return TreeVisitResult.CONTINUE;
      });

      expectVisited(groupBox);
      expectVisited(groupBox.fields[0]);
      expectVisited(groupBox.fields[1]);
      expectVisited(groupBox.fields[2]);
      expectNotVisited(groupBox.fields[2].fields[0]);
      expectNotVisited(groupBox.fields[2].fields[1]);
      expectNotVisited(groupBox.fields[2].fields[1].fields[0]);
      expectNotVisited(groupBox.fields[2].fields[1].fields[1]);
      expectNotVisited(groupBox.fields[3]);
      expectNotVisited(groupBox.fields[3].fields[0]);

      // reset visited flag
      groupBox.visitFields(function(field) {
        field.hasBeenVisited = false;
      });

      groupBox.visitFields(function(field) {
        field.hasBeenVisited = true;
        if (field instanceof RadioButtonGroup) {
          return TreeVisitResult.TERMINATE;
        }
        return TreeVisitResult.CONTINUE;
      });

      expectVisited(groupBox);
      expectVisited(groupBox.fields[0]);
      expectVisited(groupBox.fields[1]);
      expectVisited(groupBox.fields[2]);
      expectVisited(groupBox.fields[2].fields[0]);
      expectVisited(groupBox.fields[2].fields[1]);
      expectNotVisited(groupBox.fields[2].fields[1].fields[0]);
      expectNotVisited(groupBox.fields[2].fields[1].fields[1]);
      expectNotVisited(groupBox.fields[3]);
      expectNotVisited(groupBox.fields[3].fields[0]);

      // reset visited flag
      groupBox.visitFields(function(field) {
        field.hasBeenVisited = false;
      });

      groupBox.visitFields(function(field) {
        field.hasBeenVisited = true;
        return TreeVisitResult.TERMINATE;
      });

      expectVisited(groupBox);
      expectNotVisited(groupBox.fields[0]);
      expectNotVisited(groupBox.fields[1]);
      expectNotVisited(groupBox.fields[2]);
      expectNotVisited(groupBox.fields[2].fields[0]);
      expectNotVisited(groupBox.fields[2].fields[1]);
      expectNotVisited(groupBox.fields[2].fields[1].fields[0]);
      expectNotVisited(groupBox.fields[2].fields[1].fields[1]);
      expectNotVisited(groupBox.fields[3]);
      expectNotVisited(groupBox.fields[3].fields[0]);
    });
  });
});

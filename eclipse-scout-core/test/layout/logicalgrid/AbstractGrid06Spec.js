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
import {Button, GridData, GroupBoxGridConfig, HorizontalGrid, scout, VerticalSmartGrid} from '../../../src/index';
import {GroupBoxSpecHelper} from '../../../src/testing/index';

/**
 * Reference implementation javadoc:
 *
 * <h4>Vertical</h4>
 *
 * <pre>
 * ---------------------------
 *    Field01   |   Field02
 * ---------------------------
 *    Field03   |   Field03
 * ---------------------------
 *    Field03   |   Field03
 * ---------------------------
 *    Field04   |   Field05
 * ---------------------------
 * </pre>
 *
 * <h4>Horizontal</h4>
 *
 * <pre>
 * ---------------------------
 *    Field01   |   Field02
 * ---------------------------
 *    Field03   |   Field03
 * ---------------------------
 *    Field03   |   Field03
 * ---------------------------
 *    Field04   |   Field05
 * ---------------------------
 * </pre>
 *
 * @author Andreas Hoegger
 * @since 4.0.0 M6 25.02.2014
 */
// see reference implementation org.eclipse.scout.rt.client.ui.form.fields.groupbox.internal.GroupBoxLayout06Test
describe('AbstractGrid06', function() {
  var session;

  beforeEach(function() {
    setFixtures(sandbox());
    session = sandboxSession();

    this.fields = [];
    this.groupBox = scout.create('GroupBox', {
      parent: session.desktop,
      gridColumnCount: 2
    });
    this.fields.push(scout.create('StringField', {
      parent: this.groupBox,
      label: 'Field 01'
    }));
    this.fields.push(scout.create('StringField', {
      parent: this.groupBox,
      label: 'Field 02'
    }));
    this.fields.push(scout.create('StringField', {
      parent: this.groupBox,
      label: 'Field 03',
      gridDataHints: new GridData({
        h: 2,
        w: 2
      })
    }));
    this.fields.push(scout.create('StringField', {
      parent: this.groupBox,
      label: 'Field 04',
      gridDataHints: new GridData({})
    }));
    this.fields.push(scout.create('StringField', {
      parent: this.groupBox,
      label: 'Field 05',
      gridDataHints: new GridData({})
    }));
    this.fields.push(scout.create('Button', {
      parent: this.groupBox,
      label: 'Close',
      systemType: Button.SystemType.CLOSE
    }));
    this.groupBox.setProperty('fields', this.fields);
    this.groupBox.render();
  });

  describe('group box layout 06', function() {
    it('test horizontal layout', function() {
      var grid = new HorizontalGrid();
      grid.setGridConfig(new GroupBoxGridConfig());
      grid.validate(this.groupBox);

      // group box
      expect(grid.getGridRowCount()).toEqual(4);
      expect(grid.getGridColumnCount()).toEqual(2);

      // field01
      GroupBoxSpecHelper.assertGridData(0, 0, 1, 1, this.fields[0].gridData);

      // field02
      GroupBoxSpecHelper.assertGridData(1, 0, 1, 1, this.fields[1].gridData);

      // field03
      GroupBoxSpecHelper.assertGridData(0, 1, 2, 2, this.fields[2].gridData);

      // field04
      GroupBoxSpecHelper.assertGridData(0, 3, 1, 1, this.fields[3].gridData);

      // field05
      GroupBoxSpecHelper.assertGridData(1, 3, 1, 1, this.fields[4].gridData);
    });

    it('test vertical smart layout', function() {
      var grid = new VerticalSmartGrid();
      grid.setGridConfig(new GroupBoxGridConfig());
      grid.validate(this.groupBox);

      // group box
      expect(grid.getGridRowCount()).toEqual(4);
      expect(grid.getGridColumnCount()).toEqual(2);

      // field01
      GroupBoxSpecHelper.assertGridData(0, 0, 1, 1, this.fields[0].gridData);

      // field02
      GroupBoxSpecHelper.assertGridData(1, 0, 1, 1, this.fields[1].gridData);

      // field03
      GroupBoxSpecHelper.assertGridData(0, 1, 2, 2, this.fields[2].gridData);

      // field04
      GroupBoxSpecHelper.assertGridData(0, 3, 1, 1, this.fields[3].gridData);

      // field05
      GroupBoxSpecHelper.assertGridData(1, 3, 1, 1, this.fields[4].gridData);
    });
  });

});

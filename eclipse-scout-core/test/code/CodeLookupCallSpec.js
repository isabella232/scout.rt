/*
 * Copyright (c) 2010-2019 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
import {codes, scout} from '../../src/index';

describe('CodeLookupCall', function() {
  var session, codeType123;

  beforeEach(function() {
    setFixtures(sandbox());
    session = sandboxSession();
    codes.registry = {};
    codeType123 = scout.create('CodeType', {
      id: 'codeType.123',
      codes: [{
        id: 'code.1',
        objectType: 'Code',
        text: 'code 1'
      }, {
        id: 'code.2',
        objectType: 'Code',
        text: 'code 2',
        children: [{
          id: 'childcode.2a',
          objectType: 'Code',
          text: 'child code 2a'
        }, {
          id: 'childcode.2b',
          objectType: 'Code',
          text: 'child code 2b'
        }]
      }]
    });
  });

  function createLookupCall(codeType) {
    return scout.create('CodeLookupCall', {
      session: session,
      codeType: codeType.id
    });
  }

  describe('getByKey', function() {
    beforeEach(function() {
      codes.add(codeType123);
    });

    it('returns a promise which will resolve with a lookup row for the code by key', function(done) {
      createLookupCall(codeType123).getByKey('code.1')
        .then(function(result) {
          expect(result.lookupRows[0].key).toBe('code.1');
          expect(result.lookupRows[0].text).toBe('code 1');
        })
        .catch(fail)
        .always(done);
    });

    it('returns a promise which will be rejected if key doesn\' exist', function(done) {
      createLookupCall(codeType123).getByKey('asdf')
        .then(function(result) {
          fail('Promise should be rejected but was resolved.');
        })
        .catch(function() {
          expect(true).toBe(true);
          done();
        });
    });
  });

  describe('getByText', function() {
    beforeEach(function() {
      codes.add(codeType123);
    });

    it('returns the lookupRows which match the given text', function(done) {
      var promise1 = createLookupCall(codeType123).getByText('code')
        .then(function(result) {
          expect(result.lookupRows.length).toBe(2);
          expect(result.lookupRows[0].key).toBe('code.1');
          expect(result.lookupRows[0].text).toBe('code 1');
          expect(result.lookupRows[1].key).toBe('code.2');
          expect(result.lookupRows[1].text).toBe('code 2');
        })
        .catch(fail);

      var promise2 = createLookupCall(codeType123).getByText('code 2')
        .then(function(result) {
          expect(result.lookupRows.length).toBe(1);
          expect(result.lookupRows[0].key).toBe('code.2');
          expect(result.lookupRows[0].text).toBe('code 2');
        })
        .catch(fail);

      $.promiseAll(promise1, promise2).then(done);
    });

    it('returns no lookupRows if no codes match the given text', function(done) {
      createLookupCall(codeType123).getByText('asdf')
        .then(function(result) {
          expect(result.lookupRows.length).toBe(0);
        })
        .catch(fail)
        .always(done);
    });
  });

  describe('getByRec', function() {
    beforeEach(function() {
      codes.add(codeType123);
    });

    it('returns the lookupRows of the children of the given parent key', function(done) {
      createLookupCall(codeType123).getByRec('code.2')
        .then(function(result) {
          expect(result.lookupRows.length).toBe(2);
          expect(result.lookupRows[0].key).toBe('childcode.2a');
          expect(result.lookupRows[0].text).toBe('child code 2a');
          expect(result.lookupRows[1].key).toBe('childcode.2b');
          expect(result.lookupRows[1].text).toBe('child code 2b');
        })
        .catch(fail)
        .always(done);
    });

    it('returns no lookupRows if the parent code doesn\'t have children', function(done) {
      createLookupCall(codeType123).getByRec('code.1')
        .then(function(result) {
          expect(result.lookupRows.length).toBe(0);
        })
        .catch(fail)
        .always(done);
    });

    it('returns no lookupRows if no codes match the given text', function(done) {
      createLookupCall(codeType123).getByRec('asdf')
        .then(function(result) {
          expect(result.lookupRows.length).toBe(0);
        })
        .catch(fail)
        .always(done);
    });
  });

  describe('getByAll', function() {
    beforeEach(function() {
      codes.add(codeType123);
    });

    it('returns lookupRows for every code', function(done) {
      createLookupCall(codeType123).getAll()
        .then(function(result) {
          expect(result.lookupRows.length).toBe(4);
          expect(result.lookupRows[0].key).toBe('code.1');
          expect(result.lookupRows[0].text).toBe('code 1');
          expect(result.lookupRows[0].parentKey).toBe(null);
          expect(result.lookupRows[1].key).toBe('code.2');
          expect(result.lookupRows[1].text).toBe('code 2');
          expect(result.lookupRows[1].parentKey).toBe(null);
          expect(result.lookupRows[2].key).toBe('childcode.2a');
          expect(result.lookupRows[2].text).toBe('child code 2a');
          expect(result.lookupRows[2].parentKey).toBe('code.2');
          expect(result.lookupRows[3].key).toBe('childcode.2b');
          expect(result.lookupRows[3].text).toBe('child code 2b');
          expect(result.lookupRows[3].parentKey).toBe('code.2');
        })
        .catch(fail)
        .always(done);
    });
  });

  describe('scout.codes.remove', function() {

    it('makes, that existing lookup calls don\'t return a result anymore', function(done) {
      codes.add(codeType123);
      var lookupCall = createLookupCall(codeType123);

      lookupCall.cloneForKey('code.1').execute()
        .then(function(result) {
          expect(result.lookupRows[0].key).toBe('code.1');
          expect(result.lookupRows[0].text).toBe('code 1');
        })
        .catch(fail)
        .then(function() {
          codes.remove(codeType123);
          return lookupCall.cloneForKey('code.1').execute();
        })
        .then(function(result) {
          fail('Promise should be rejected but was resolved.');
        })
        .catch(function() {
          done();
        });
    });
  });

  describe('scout.codes.add', function() {

    it('makes, that existing lookups consider the new code type', function(done) {
      codes.add(codeType123);
      var lookupCall = createLookupCall(codeType123);

      lookupCall.cloneForKey('code.1').execute()
        .then(function(result) {
          expect(result.lookupRows[0].key).toBe('code.1');
          expect(result.lookupRows[0].text).toBe('code 1');
        })
        .then(function() {
          codes.remove(codeType123);
          codes.add({
            id: 'codeType.123',
            objectType: 'CodeType',
            codes: [{
              id: 'newcode.1',
              objectType: 'Code',
              text: 'new code 1'
            }]
          });
          return lookupCall.cloneForKey('newcode.1').execute();
        })
        .then(function(result) {
          expect(result.lookupRows[0].key).toBe('newcode.1');
          expect(result.lookupRows[0].text).toBe('new code 1');
        })
        .catch(fail)
        .then(function() {
          return lookupCall.cloneForKey('code.1').execute();
        })
        .then(function(result) {
          // Code.1 does not exist anymore -> has to fail
          fail('Promise should be rejected but was resolved.');
        })
        .catch(function() {
          done();
        });
    });
  });
});

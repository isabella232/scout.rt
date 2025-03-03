/*
 * Copyright (c) 2014-2017 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
import {Device, objects} from '../../index';
import $ from 'jquery';

/**
 * Text comparator, used to compare strings with support for internationalization (i18n).
 * The collator object is only installed once.
 */
const TEXT = {
  collator: null,
  installed: false,
  install: function(session) {
    if (this.installed) {
      return !!this.collator;
    }

    // set static collator variable once
    if (Device.get().supportsInternationalization()) {
      this.collator = new window.Intl.Collator(session.locale.languageTag);
      $.log.isInfoEnabled() && $.log.info('(comparators.TEXT#install) Browser supports i18n - installed Intl.Collator, can sort in Browser');
    } else {
      $.log.isInfoEnabled() && $.log.info('(comparators.TEXT#install) Browser doesn\'t support i18n. Must sort on server');
    }

    this.installed = true;
    return !!this.collator;
  },
  compare: function(valueA, valueB) {
    if (!valueA && !valueB) {
      return 0;
    }
    if (!valueA) {
      return -1;
    }
    if (!valueB) {
      return 1;
    }

    if (!this.collator) {
      // Fallback for browsers that don't support internationalization. This is only necessary
      // for callers that call this method without check for internationalization support
      // first (e.g. TableMatrix).
      return (valueA < valueB ? -1 : ((valueA > valueB) ? 1 : 0));
    }
    // We don't check the installed flag here. It's a program error when we come here
    // and the collator is not set. Either we forgot to call install() or we've called
    // install but the browser does not support i18n.
    return this.collator.compare(valueA, valueB);
  },
  compareIgnoreCase: function(valueA, valueB) {
    if (!valueA) {
      valueA = null;
    }
    if (!valueB) {
      valueB = null;
    }
    if (valueA === valueB) {
      return 0;
    }
    if (valueA === null) {
      return -1;
    }
    if (valueB === null) {
      return 1;
    }
    return this.compare(valueA.toLowerCase(), valueB.toLowerCase());
  }
};

/**
 * Numeric comparator, used to compare numeric values. Used for numbers, dates, etc.
 */
const NUMERIC = {
  install: function(session) {
    // NOP
    return true;
  },
  compare: function(valueA, valueB) {
    if (objects.isNullOrUndefined(valueA) && objects.isNullOrUndefined(valueB)) {
      return 0;
    }
    if (objects.isNullOrUndefined(valueA)) {
      return -1;
    }
    if (objects.isNullOrUndefined(valueB)) {
      return 1;
    }

    if (valueA < valueB) {
      return -1;
    } else if (valueA > valueB) {
      return 1;
    }
    return 0;
  }
};

/**
 * Alphanumeric comparator.
 */
const ALPHANUMERIC = {
  collator: null,
  installed: false,
  install: function(session) {
    TEXT.install(session);
    this.collator = TEXT.collator;
    return !!this.collator && NUMERIC.install(session);
  },
  compare: function(valueA, valueB) {
    return this._compare(valueA, valueB, false);
  },
  compareIgnoreCase: function(valueA, valueB) {
    return this._compare(valueA, valueB, true);
  },
  _compare: function(valueA, valueB, ignoreCase) {
    if (!valueA && !valueB) {
      return 0;
    }
    if (!valueA) {
      return -1;
    }
    if (!valueB) {
      return 1;
    }

    var pattern = '(([0-9]+)|([^0-9]+))';
    var regexp1 = new RegExp(pattern, 'g');
    var regexp2 = new RegExp(pattern, 'g');
    var found1 = regexp1.exec(valueA);
    var found2 = regexp2.exec(valueB);
    while (found1 && found2) {
      var n1 = parseInt(found1[1], 0);
      var n2 = parseInt(found2[1], 0);
      if (!isNaN(n1) && !isNaN(n2)) {
        var numericResult = NUMERIC.compare(n1, n2);
        if (numericResult !== 0) {
          return numericResult;
        }
      } else {
        var textResult = ignoreCase ? TEXT.compareIgnoreCase(found1[1], found2[1]) : TEXT.compare(found1[1], found2[1]);
        if (textResult !== 0) {
          return textResult;
        }
      }
      found1 = regexp1.exec(valueA);
      found2 = regexp2.exec(valueB);
    }

    if (!found1 && !found2) {
      return 0;
    }
    if (!found1) {
      return -1;
    }
    return 1;
  }
};

export default {
  ALPHANUMERIC,
  NUMERIC,
  TEXT
};

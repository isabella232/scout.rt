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
import {arrays, scout, strings} from '../index';
import $ from 'jquery';

const CONST_REGEX = /\${const:([^}]*)}/;

/**
 * Uses Object.create(null) to create an object without a prototype. This is different to use the literal {} which links the object to Object.prototype.
 * <p>
 * Not using the literal has the advantage that the object does not contain any inherited properties like `toString` so it is not necessary to use `o.hasOwnProperty(p)`
 * instead of `p in o` to check for the existence.
 *
 * @param [object] properties optional initial properties to be set on the new created object
 */
export function createMap(properties) {
  var map = Object.create(null);
  if (properties) {
    $.extend(map, properties);
  }
  return map;
}

/**
 * Copies all the properties (including the ones from the prototype.) from dest to source
 * @param {[]} [filter] an array of property names.
 * @returns {object} the destination object (the destination parameter will be modified as well)
 */
export function copyProperties(source, dest, filter) {
  var propertyName;
  filter = arrays.ensure(filter);
  for (propertyName in source) {
    if (filter.length === 0 || filter.indexOf(propertyName) !== -1) {
      dest[propertyName] = source[propertyName];
    }
  }
  return dest;
}

/**
 * Copies the own properties (excluding the ones from the prototype) from dest to source.
 * If a filter is specified, only the properties matching the ones in the filter are copied.
 * @param {[]} [filter] an array of property names.
 * @returns {object} the destination object (the destination parameter will be modified as well)
 */
export function copyOwnProperties(source, dest, filter) {
  var propertyName;
  filter = arrays.ensure(filter);
  for (propertyName in source) {
    if (Object.prototype.hasOwnProperty.call(source, propertyName) && (filter.length === 0 || filter.indexOf(propertyName) !== -1)) {
      dest[propertyName] = source[propertyName];
    }
  }
  return dest;
}

/**
 * Counts and returns the properties of a given object or map (see #createMap).
 */
export function countOwnProperties(obj) {
  // map objects don't have a prototype
  if (!Object.getPrototypeOf(obj)) {
    return Object.keys(obj).length;
  }

  // regular objects may inherit a property through their prototype
  // we're only interested in own properties
  var count = 0;
  for (var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      count++;
    }
  }
  return count;
}

/**
 * Copies the specified properties (including the ones from the prototype) from source to dest.
 * Properties that already exist on dest are NOT overwritten.
 */
export function extractProperties(source, dest, properties) {
  properties.forEach(function(propertyName) {
    if (dest[propertyName] === undefined) {
      dest[propertyName] = source[propertyName];
    }
  });
  return dest;
}

/**
 * returns
 *  - true if the obj has at least one of the given properties.
 *  - false if the obj has none of the given properties.
 *
 * @param obj
 * @param properties a single property or an array of properties
 * @returns {Boolean}
 */
export function someOwnProperties(obj, properties) {
  var propArr = arrays.ensure(properties);
  return propArr.some(function(prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  });
}

/**
 * returns
 *  - true if the obj or its prototypes have at least one of the given properties.
 *  - false if the obj or its prototypes have none of the given properties.
 *
 * @param obj
 * @param properties a single property or an array of properties
 * @returns {Boolean}
 */
export function someProperties(obj, properties) {
  var propArr = arrays.ensure(properties);
  return propArr.some(function(prop) {
    return prop in obj;
  });
}

export function valueCopy(obj) {
  // Nothing to be done for immutable things
  if (obj === undefined || obj === null || typeof obj !== 'object') {
    return obj;
  }
  var copy;
  // Arrays
  if (Array.isArray(obj)) {
    copy = [];
    for (var i = 0; i < obj.length; i++) {
      copy[i] = valueCopy(obj[i]);
    }
    return copy;
  }
  // All other objects
  copy = {};
  for (var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      copy[prop] = valueCopy(obj[prop]);
    }
  }
  return copy;
}

/**
 * Returns the first object with the given property and propertyValue or null if there is no such object within parentObj.
 * @param parentObj
 * @param property property to search for
 * @param propertyValue value of the property
 * @returns {Object}
 */
export function findChildObjectByKey(parentObj, property, propertyValue) {
  if (parentObj === undefined || parentObj === null || typeof parentObj !== 'object') {
    return null;
  }
  if (parentObj[property] === propertyValue) {
    return parentObj;
  }
  var child;
  if (Array.isArray(parentObj)) {
    for (var i = 0; i < parentObj.length; i++) {
      child = findChildObjectByKey(parentObj[i], property, propertyValue);
      if (child) {
        return child;
      }
    }
  }
  for (var prop in parentObj) {
    if (Object.prototype.hasOwnProperty.call(parentObj, prop)) {
      child = findChildObjectByKey(parentObj[prop], property, propertyValue);
      if (child) {
        return child;
      }
    }
  }
  return null;
}

/**
 * Returns true if the given object is an object, _not_ an array and not null or undefined.
 */
export function isPlainObject(obj) {
  return typeof obj === 'object' &&
    !isNullOrUndefined(obj) &&
    !Array.isArray(obj);
}

/**
 * Null-safe access the property of an objects. Examples:
 * <ul>
 * <li><code>optProperty(obj, 'value');</code> try to access and return obj.value</li>
 * <li><code>optProperty(obj, 'foo', 'bar');</code> try to access and return obj.foo.bar</li>
 * </ul>
 *
 * @returns {*} the value of the requested property or undefined if the property does not exist on the object
 */
export function optProperty(obj) {
  if (!obj) {
    return null;
  }

  var numArgs = arguments.length;
  if (numArgs < 2) {
    return obj;
  }
  if (numArgs === 2) {
    return obj[arguments[1]];
  }

  for (var i = 1; i < numArgs - 1; i++) {
    obj = obj[arguments[i]];
    if (!obj) {
      return null;
    }
  }
  return obj[arguments[numArgs - 1]];
}

/**
 * Returns true if:
 * - obj is not undefined or null
 * - obj not isNaN
 * - obj isFinite
 *
 * This method is handy in cases where you want to check if a number is set. Since you cannot write:
 *   if (myNumber) { ...
 *
 * Because when myNumber === 0 would also resolve to false. In that case use instead:
 *   if (isNumber(myNumber)) { ...
 *
 * @param obj
 * @returns {Boolean}
 */
export function isNumber(obj) {
  return obj !== null && !isNaN(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
}

export function isString(obj) {
  return typeof obj === 'string';
}

export function isNullOrUndefined(obj) {
  return obj === null || obj === undefined;
}

export function isFunction(obj) {
  return $.isFunction(obj);
}

export function isArray(obj) {
  return Array.isArray(obj);
}

/**
 * Returns values from the given (map) object. By default only values of 'own' properties are returned.
 *
 * @returns {Array} an Array with values
 * @param {Object} obj
 * @param {boolean} [all] can be set to true to return all properties instead of own properties
 */
export function values(obj, all) {
  var values = [];
  if (obj) {
    if (typeof obj.hasOwnProperty !== 'function') {
      all = true;
    }
    for (var key in obj) {
      if (all || obj.hasOwnProperty(key)) {
        values.push(obj[key]);
      }
    }
  }
  return values;
}

/**
 * @returns {string} the key / name of a property
 */
export function keyByValue(obj, value) {
  return Object.keys(obj)[values(obj).indexOf(value)];
}

/**
 * Java-like equals method. Compares the given objects by checking with ===, if that fails, the function
 * checks if both objects have an equals function and use the equals function to compare the two objects
 * by value.
 * @returns {boolean} true if both objects are equals by reference or by value
 */
export function equals(objA, objB) {
  if (objA === objB) {
    return true;
  }
  // both objects have an equals() method
  if (objA && objB && (objA.equals && objB.equals)) {
    return objA.equals(objB);
  }
  return false;
}

/**
 * Compare two objects and all its child elements recursively.
 * @returns {boolean} true if both objects and all child elements are equals by value or implemented equals method
 */
export function equalsRecursive(objA, objB) {
  var i;
  if (isPlainObject(objA) && isPlainObject(objB)) {
    if (isFunction(objA.equals) && isFunction(objB.equals)) {
      return objA.equals(objB);
    }
    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);
    if (!arrays.equalsIgnoreOrder(keysA, keysB)) {
      return false;
    }
    for (i = 0; i < keysA.length; i++) {
      if (!equalsRecursive(objA[keysA[i]], objB[keysA[i]])) {
        return false;
      }
    }
    return true;
  } else if (isArray(objA) && isArray(objB)) {
    if (objA.length !== objB.length) {
      return false;
    }
    for (i = 0; i < objA.length; i++) {
      if (!equalsRecursive(objA[i], objB[i])) {
        return false;
      }
    }

    return true;
  }
  return objA === objB;
}

/**
 * Compares a list of properties of two objects by using the equals method for each property.
 */
export function propertiesEquals(objA, objB, properties) {
  var i, property;
  for (i = 0; i < properties.length; i++) {
    property = properties[i];
    if (!equals(objA[property], objB[property])) {
      return false;
    }
  }
  return true;
}

/**
 * @returns {function} the function identified by funcName from the given object. The function will return an error
 *     if that function does not exist. Use this function if you modify an existing framework function
 *     to find problems after refactorings / renamings as soon as possible.
 */
export function mandatoryFunction(obj, funcName) {
  var func = obj[funcName];
  if (!func || typeof func !== 'function') {
    throw new Error('Function \'' + funcName + '\' does not exist on object. Check if it has been renamed or moved.', obj);
  }
  return func;
}

/**
 * Use this method to replace a function on a prototype of an object. It checks if that function exists
 * by calling <code>mandatoryFunction</code>.
 */
export function replacePrototypeFunction(obj, funcName, func, rememberOrig) {
  var proto = obj.prototype;
  mandatoryFunction(proto, funcName);
  if (rememberOrig) {
    proto[funcName + 'Orig'] = proto[funcName];
  }
  proto[funcName] = func;
}

/**
 * @returns a real Array for the pseudo-array 'arguments'.
 */
export function argumentsToArray(args) {
  return args ? Array.prototype.slice.call(args) : [];
}

/**
 * Used to loop over 'arguments' pseudo-array with forEach.
 */
export function forEachArgument(args, func) {
  return argumentsToArray(args).forEach(func);
}

/**
 * Development utility to check if overrides in JavaScript "classes" are correct.
 *
 * How to use:
 *   1. Start application in development mode (non-minimized).
 *   2. Open browser's development console
 *   3. Type: checkFunctionOverrides().join('\n')
 */
export function checkFunctionOverrides() {
  var whitelist = [
    'ModelAdapter.init',
    'ModelAdapter._init',
    'Calendar.init'
  ];
  var result1 = [
    'Legend:',
    '[!] Function includes super call, and parent function uses arguments',
    ' ~  Function includes super call, but parent function does not use arguments',
    '    Function does not include super call',
    '',
    'Wrong number of arguments:'
  ];
  var result2 = ['Different argument names:'];

  for (var prop in scout) {
    if (!scout.hasOwnProperty(prop)) {
      continue;
    }
    var o = scout[prop];
    // Only check functions that have a "parent"
    if (typeof o === 'function' && o.parent) {
      for (var name in o.prototype) {
        if (!o.prototype.hasOwnProperty(name)) {
          continue;
        }
        var fn = o.prototype[name];
        // Ignore constructor, inherited properties and non-functions
        if (name === 'constructor' || !o.prototype.hasOwnProperty(name) || typeof fn !== 'function') {
          continue;
        }
        var args = getFunctionArguments(fn);
        // Check all parents
        var parent = o.parent;
        while (parent) {
          var parentFn = parent.prototype[name];
          if (parent.prototype.hasOwnProperty(name) && typeof parentFn === 'function') {
            var parentArgs = getFunctionArguments(parentFn);
            // Check arguments (at least all of the parent args must be present)
            var mismatch = false;
            for (var i = 0; i < parentArgs.length; i++) {
              if (args.length < i || args[i] !== parentArgs[i]) {
                mismatch = true;
                break;
              }
            }
            var fname = prop + '.' + name;
            if (mismatch && whitelist.indexOf(fname) === -1) { // && args.length !== parentArgs.length) {
              // Collect found mismatch
              var result = fname + '(' + args.join(', ') + ') does not correctly override ' + getPrototypeOwner(parentFn) + '.' + name + '(' + parentArgs.join(', ') + ')';
              var includesSuperCall = fn.toString().match(new RegExp('scout.' + strings.quote(prop) + '.parent.prototype.' + strings.quote(name) + '.call\\(')) !== null;
              var parentFunctionUsesArguments = false;
              if (includesSuperCall) {
                for (var j = 0; j < parentArgs.length; j++) {
                  var m = parentFn.toString().match(new RegExp('[^.\\w]' + strings.quote(parentArgs[j]) + '[^\\w]', 'g'));
                  if (m !== null && m.length > 1) {
                    parentFunctionUsesArguments = true;
                    break;
                  }
                }
              }
              result = (includesSuperCall ? parentFunctionUsesArguments ? '[!]' : ' ~ ' : '   ') + ' ' + result;
              if (args.length !== parentArgs.length) {
                result1.push(result);
              } else {
                result2.push(result);
              }
            }
          }
          parent = parent.parent;
        }
      }
    }
  }

  result1.push('');
  return result1.concat(result2);

  // ----- Helper functions -----

  function getFunctionArguments(fn) {
    var FN_COMMENTS = /\/\*.*?\*\/|\/\/.*$/mg; // removes comments in function declaration
    var FN_ARGS = /^function[^(]*\((.*?)\)/m; // fetches all arguments in m[1]

    if (typeof fn !== 'function') {
      throw new Error('Argument is not a function: ' + fn);
    }

    var m = fn.toString().replace(FN_COMMENTS, '')
      .match(FN_ARGS);
    var args = [];
    if (m !== null) {
      m[1].split(',').forEach(function(arg, i) {
        arg = arg.trim();
        if (arg.length > 0) {
          args.push(arg);
        }
      });
    }
    return args;
  }

  function getPrototypeOwner(fx) {
    for (var prop in scout) {
      if (!scout.hasOwnProperty(prop)) {
        continue;
      }
      var o = scout[prop];
      if (typeof o === 'function') {
        for (var name in o.prototype) {
          if (!o.prototype.hasOwnProperty(name)) {
            continue;
          }
          var fn = o.prototype[name];
          // Ignore constructor, inherited properties and non-functions
          if (name === 'constructor' || !o.prototype.hasOwnProperty(name) || typeof fn !== 'function') {
            continue;
          }
          if (fn === fx) {
            return prop;
          }
        }
      }
    }
    return '';
  }
}

/**
 * @param value text which contains a constant reference like '${const:FormField.LabelPosition.RIGHT}'.
 * @return the resolved constant value or the unchanged input value if the constant could not be resolved.
 */
export function resolveConst(value, constType) {
  if (!isString(value)) {
    return value;
  }

  var result = CONST_REGEX.exec(value);
  if (result && result.length === 2) {
    // go down the object hierarchy starting on the given constType-object or on 'window'
    var objectHierarchy = result[1].split('.');
    var obj = constType || window;
    for (var i = 0; i < objectHierarchy.length; i++) {
      obj = obj[objectHierarchy[i]];
      if (obj === undefined) {
        window.console.log('Failed to resolve constant \'' + result[1] + '\', object is undefined');
        return value;
      }
    }
    return obj;
  }
  return value;
}

/**
 * @param object config An object with 2 properties: property, constType
 */
export function resolveConstProperty(object, config) {
  scout.assertProperty(config, 'property');
  scout.assertProperty(config, 'constType');
  var value = object[config.property];
  var resolvedValue = resolveConst(value, config.constType);
  if (value !== resolvedValue) {
    object[config.property] = resolvedValue;
  }
}

export default {
  CONST_REGEX,
  argumentsToArray,
  checkFunctionOverrides,
  copyOwnProperties,
  copyProperties,
  countOwnProperties,
  createMap,
  equals,
  equalsRecursive,
  extractProperties,
  findChildObjectByKey,
  forEachArgument,
  isArray,
  isFunction,
  isNullOrUndefined,
  isNumber,
  isPlainObject,
  isString,
  keyByValue,
  mandatoryFunction,
  optProperty,
  propertiesEquals,
  replacePrototypeFunction,
  resolveConst,
  resolveConstProperty,
  someOwnProperties,
  someProperties,
  valueCopy,
  values
};

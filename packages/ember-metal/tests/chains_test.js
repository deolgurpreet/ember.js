import { addObserver } from '../observer';
import { get } from '../property_get';
import { finishChains } from '../chains';
import { defineProperty } from '../properties';
import computed from '../computed';
import { propertyDidChange } from '../property_events';
import { peekMeta } from '../meta';

QUnit.module('Chains');

// TODO: Do we support this?
QUnit.skip('finishChains should properly copy chains from prototypes to instances', function() {
  function didChange() {}

  let obj = {};
  addObserver(obj, 'foo.bar', null, didChange);

  let childObj = Object.create(obj);
  finishChains(childObj);
  ok(peekMeta(obj) !== peekMeta(childObj).readableChains(), 'The chains object is copied');
});


QUnit.test('observer and CP chains', function() {
  let obj = { };

  defineProperty(obj, 'foo', computed('qux.[]', function() { }));
  defineProperty(obj, 'qux', computed(function() { }));

  // create DK chains
  get(obj, 'foo');

  // create observer chain
  addObserver(obj, 'qux.length', function() { });

  /*
             +-----+
             | qux |   root CP
             +-----+
                ^
         +------+-----+
         |            |
     +--------+    +----+
     | length |    | [] |  chainWatchers
     +--------+    +----+
      observer       CP(foo, 'qux.[]')
  */

  // invalidate qux
  propertyDidChange(obj, 'qux');

  // CP chain is blown away

  /*
             +-----+
             | qux |   root CP
             +-----+
                ^
         +------+xxxxxx
         |            x
     +--------+    xxxxxx
     | length |    x [] x  chainWatchers
     +--------+    xxxxxx
      observer       CP(foo, 'qux.[]')
  */

  get(obj, 'qux'); // CP chain re-recreated
  ok(true, 'no crash');
});

import path from 'path';
import test from 'ava';
import realpath from '.';

test('async', async t => {
  t.is(path.basename(await realpath('fixture.js')), 'test.js');
});

test('sync', t => {
  t.is(path.basename(realpath.sync('fixture.js')), 'test.js');
});

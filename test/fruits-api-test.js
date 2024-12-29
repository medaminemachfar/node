/* eslint-disable no-undef */
'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');

const mockDb = {
  query: () => {
    return Promise.resolve();
  }
};

const Books = proxyquire('../lib/api/Books', {
  '../db': mockDb
});

describe('Books methods', () => {
  it('API', () => {
    assert.strictEqual(typeof Books.find, 'function');
    assert.strictEqual(typeof Books.findAll, 'function');
    assert.strictEqual(typeof Books.create, 'function');
    assert.strictEqual(typeof Books.update, 'function');
    assert.strictEqual(typeof Books.remove, 'function');
  });

  it('find all', () => {
    const result = Books.findAll();
    assert.strictEqual(result instanceof Promise, true);
  });

  it('find', () => {
    const result = Books.find('id');
    assert.strictEqual(result instanceof Promise, true);
  });

  it('create', () => {
    const result = Books.create('name', 'stock');
    assert.strictEqual(result instanceof Promise, true);
  });

  it('update', () => {
    const result = Books.update({ name: 'name', stock: 'stock', id: 1 });
    assert.strictEqual(result instanceof Promise, true);
  });

  it('remove', () => {
    const result = Books.remove('id');
    assert.strictEqual(result instanceof Promise, true);
  });
});

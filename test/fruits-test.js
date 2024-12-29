/* eslint-disable no-undef */
'use strict';

const assert = require('assert');
const supertest = require('supertest');
const proxyquire = require('proxyquire');

const mockDb = {
  init: () => {
    return Promise.resolve();
  }
};

describe('Books', () => {
  it('get all', async () => {
    const mockApi = {
      findAll: () => Promise.resolve({ rows: [{ id: 1 }] })
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const { body } = await supertest(app)
      .get('/api/Books')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(Array.isArray(body), true);
    assert.strictEqual(body.length, 1);
  });

  it('get all error', async () => {
    const mockApi = {
      findAll: () => Promise.reject(new Error('error'))
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const response = await supertest(app)
      .get('/api/Books')
      .expect(400);

    assert.strictEqual(response.statusCode, 400);
  });

  it('get one', async () => {
    const mockApi = {
      find: id => {
        assert.strictEqual(id, '1');
        return Promise.resolve({ rows: [{ id }] });
      }
    };
    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });
    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });
    const { body } = await supertest(app)
      .get('/api/Books/1')
      .expect('Content-Type', /json/)
      .expect(200);
    assert.strictEqual(Array.isArray(body), false);
    assert.strictEqual(body.id, '1');
  });

  it('get one - return 404', async () => {
    const mockApi = {
      find: () => Promise.resolve({ rowCount: 0 })
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });
    const response = await supertest(app)
      .get('/api/Books/1')
      .expect(404);
    assert.strictEqual(response.text, 'Item 1 not found');
  });

  it('get one - error', async () => {
    const mockApi = {
      find: () => Promise.reject(new Error('error'))
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const response = await supertest(app)
      .get('/api/Books/1')
      .expect(400);
    assert.strictEqual(response.statusCode, 400);
  });

  it('post', async () => {
    const BookData = {
      name: 'Banana',
      stock: 10
    };

    const mockApi = {
      create: (name, stock) => {
        assert.strictEqual(name, BookData.name);
        assert.strictEqual(stock, BookData.stock);
        return Promise.resolve({ rows: [] });
      }
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const response = await supertest(app)
      .post('/api/Books')
      .send(BookData)
      .expect(201);
    assert.strictEqual(response.statusCode, 201);
  });

  it('post - error - no name', async () => {
    const BookData = {
      stock: 10
    };

    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .post('/api/Books')
      .send(BookData)
      .expect(422);
    assert.strictEqual(response.statusCode, 422);
    assert.strictEqual(response.text, 'The name is required!');
  });

  it('post - error - no stock', async () => {
    const BookData = {
      name: 'Banana'
    };

    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .post('/api/Books')
      .send(BookData)
      .expect(422);
    assert.strictEqual(response.statusCode, 422);
    assert.strictEqual(response.text, 'The stock must be greater or equal to 0!');
  });

  it('post - error - id error', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .post('/api/Books')
      .send({ name: 'Banana', stock: 10, id: 22 })
      .expect(422);

    assert.strictEqual(response.statusCode, 422);
    assert.strictEqual(response.text, 'Id was invalidly set on request.');
  });

  it('post - error', async () => {
    const BookData = {
      name: 'Banana',
      stock: 10
    };

    const mockApi = {
      create: () => {
        return Promise.reject(new Error('error'));
      }
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const response = await supertest(app)
      .post('/api/Books')
      .send(BookData)
      .expect(400);

    assert.strictEqual(response.statusCode, 400);
  });

  it('post - error - id error', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .post('/api/Books')
      .send({ name: 'Banana', stock: 10, id: 22 })
      .expect(422);

    assert.strictEqual(response.statusCode, 422);
    assert.strictEqual(response.text, 'Id was invalidly set on request.');
  });

  it('post - error - no payload', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .post('/api/Books')
      .expect(415);

    assert.strictEqual(response.statusCode, 415);
    assert.strictEqual(response.text, 'Invalid payload!');
  });

  it('post - error - invalid payload', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .post('/api/Books')
      .set('Content-Type', 'application/json')
      .send('Some text')
      .expect(415);

    assert.strictEqual(response.statusCode, 415);
    assert.strictEqual(response.text, 'Invalid payload!');
  });

  it('post - error - xml payload', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });
    const xmlBookData = '<?xml version="1.0" encoding="UTF-8"?><Book><name>Banana</name><stock>10</stock></Book>';

    const response = await supertest(app)
      .post('/api/Books')
      .set('Content-Type', 'application/xml')
      .send(xmlBookData)
      .expect(415);

    assert.strictEqual(response.statusCode, 415);
    assert.strictEqual(response.text, 'Invalid payload!');
  });

  it('post - error - JSON Content-Type and XML body', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });
    const xmlBookData = '<?xml version="1.0" encoding="UTF-8"?><Book><name>adam</name><stock>10</stock></Book>';

    const response = await supertest(app)
      .post('/api/Books')
      .set('Content-Type', 'application/json')
      .send(xmlBookData)
      .expect(415);

    assert.strictEqual(response.statusCode, 415);
    assert.strictEqual(response.text, 'Invalid payload!');
  });

  it('post - error - negative number of stock', async () => {
    const BookData = {
      name: 'Banana',
      stock: -10
    };

    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .post('/api/Books')
      .send(BookData)
      .expect(422);

    assert.strictEqual(response.statusCode, 422);
    assert.strictEqual(response.text, 'The stock must be greater or equal to 0!');
  });

  it('post - error - no numeric stock', async () => {
    const BookData = {
      name: 'Banana',
      stock: 'two'
    };

    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .post('/api/Books')
      .send(BookData)
      .expect(422);

    assert.strictEqual(response.statusCode, 422);
    assert.strictEqual(response.text, 'The stock must be greater or equal to 0!');
  });

  it('put', async () => {
    const BookData = {
      name: 'Banana',
      stock: 10,
      id: '20'
    };

    const mockApi = {
      update: options => {
        assert.strictEqual(options.name, BookData.name);
        assert.strictEqual(options.stock, BookData.stock);
        assert.strictEqual(options.id, BookData.id);
        return Promise.resolve({ rowCount: 1 });
      }
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const response = await supertest(app)
      .put('/api/Books/20')
      .send(BookData)
      .expect(204);

    assert.strictEqual(response.statusCode, 204);
  });

  it('put - error - no name', async () => {
    const BookData = {
      stock: 10
    };

    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .put('/api/Books/20')
      .expect(422)
      .send(BookData);

    assert.strictEqual(response.statusCode, 422);
    assert.strictEqual(response.text, 'The name is required!');
  });

  it('put - error - no stock', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .put('/api/Books/20')
      .send({ name: 'name' })
      .expect(422);

    assert.strictEqual(response.statusCode, 422);
    assert.strictEqual(response.text, 'The stock must be greater or equal to 0!');
  });

  it('put - error - id error', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .put('/api/Books/20')
      .send({ name: 'Banana', stock: 10, id: '22' })
      .expect(422);

    assert.strictEqual(response.statusCode, 422);
    assert.strictEqual(response.text, 'Id was invalidly set on request.');
  });

  it('put - error - not found', async () => {
    const BookData = {
      name: 'Banana',
      stock: 10,
      id: '20'
    };

    const mockApi = {
      update: () => {
        return Promise.resolve({ rowCount: 0 });
      }
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const response = await supertest(app)
      .put('/api/Books/20')
      .send(BookData)
      .expect(404);

    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.text, 'Unknown item 20');
  });

  it('put - error', async () => {
    const BookData = {
      name: 'Banana',
      stock: 10,
      id: '22'
    };

    const mockApi = {
      update: () => {
        return Promise.reject(new Error('error'));
      }
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const response = await supertest(app)
      .put('/api/Books/22')
      .send(BookData)
      .expect(400);

    assert.strictEqual(response.statusCode, 400);
  });

  it('put - error - no payload', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .put('/api/Books/20')
      .expect(415);

    assert.strictEqual(response.statusCode, 415);
    assert.strictEqual(response.text, 'Invalid payload!');
  });

  it('put - error - invalid payload', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .put('/api/Books/20')
      .set('Content-Type', 'application/json')
      .send('Some text')
      .expect(415);

    assert.strictEqual(response.statusCode, 415);
    assert.strictEqual(response.text, 'Invalid payload!');
  });

  it('put - error - xml payload', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });
    const xmlBookData = '<?xml version="1.0" encoding="UTF-8"?><Book><name>Banana</name><stock>10</stock></Book>';

    const response = await supertest(app)
      .put('/api/Books/10')
      .set('Content-Type', 'application/xml')
      .send(xmlBookData)
      .expect(415);

    assert.strictEqual(response.statusCode, 415);
    assert.strictEqual(response.text, 'Invalid payload!');
  });

  it('put - error - JSON Content-Type and XML body', async () => {
    const app = proxyquire('../app', {
      './lib/db': mockDb
    });
    const xmlBookData = '<?xml version="1.0" encoding="UTF-8"?><Book><name>adam</name><stock>10</stock></Book>';

    const response = await supertest(app)
      .put('/api/Books/10')
      .set('Content-Type', 'application/json')
      .send(xmlBookData)
      .expect(415);

    assert.strictEqual(response.statusCode, 415);
    assert.strictEqual(response.text, 'Invalid payload!');
  });

  it('put - error - no numeric stock', async () => {
    const BookData = {
      name: 'Banana',
      stock: 'two'
    };

    const app = proxyquire('../app', {
      './lib/db': mockDb
    });

    const response = await supertest(app)
      .put('/api/Books/10')
      .send(BookData)
      .expect(422);

    assert.strictEqual(response.statusCode, 422);
    assert.strictEqual(response.text, 'The stock must be greater or equal to 0!');
  });

  it('delete', async () => {
    const mockApi = {
      remove: id => {
        assert.strictEqual(id, '1');
        return Promise.resolve({ rowCount: 1 });
      }
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const response = await supertest(app)
      .delete('/api/Books/1')
      .expect(204);

    assert.strictEqual(response.statusCode, 204);
  });

  it('delete - error - not found', async () => {
    const mockApi = {
      remove: () => {
        return Promise.resolve({ rowCount: 0 });
      }
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const response = await supertest(app)
      .delete('/api/Books/1')
      .expect(404);

    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.text, 'Unknown item 1');
  });

  it('delete - error', async () => {
    const mockApi = {
      remove: () => {
        return Promise.reject(new Error('error'));
      }
    };

    // Mock the nested require
    const routesStub = proxyquire('../lib/routes/Books', {
      '../api/Books': mockApi
    });

    const app = proxyquire('../app', {
      './lib/db': mockDb,
      './lib/routes/Books': routesStub
    });

    const response = await supertest(app)
      .delete('/api/Books/1')
      .expect(400);

    assert.strictEqual(response.statusCode, 400);
  });
});

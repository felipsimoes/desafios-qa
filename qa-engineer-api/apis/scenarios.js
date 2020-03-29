require('dotenv').config()
const my_token = process.env.TOKEN
const request = require('supertest')
const app = 'https://api-v2.idwall.co/'
const health_check = 'health'

describe('GET /health', function() {
  it('responds with json', function(done) {
    request(app)
      .get(health_check)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
});
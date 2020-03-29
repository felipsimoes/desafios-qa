require('dotenv').config()
const my_token = process.env.TOKEN
const request = require('supertest')
const app = 'https://api-v2.idwall.co/'
const health_check = 'health'
const reports = 'relatorios'

describe('GET /health', function() {
  xit('responds with json', function(done) {
    request(app)
      .get(health_check)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
});

describe('POST /relatorios', function() {
  let payload = {
        "matriz": "consultaPessoaDefault",
        "parametros": {
          "cpf_data_de_nascimento": "",
          "cpf_nome": "",
          "cpf_numero": ""
        }
    }

  context('without token on request', () => {
    xit('returns Unauthorized status', function(done) {
      request(app)
        .post(reports)
        .send(payload)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401, done);
    });
  })

  context('with proper token on request', () => {
    it('returns Bad Request error', function(done) {
      request(app)
        .post(reports)
        .set('Authorization', my_token)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect( {
          'status_code': 400,
          'message': 'É necessário enviar ao menos um parâmetro para criação do relatório.',
          'error': 'Bad Request'
        })
        .expect(400, done)
    });
  })
});

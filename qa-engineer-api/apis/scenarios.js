// dependencias
require('dotenv').config()
const expect = require('chai').expect
const request = require('supertest')
const logger = require('pino')()

// variaveis de ambiente
const my_token = process.env.TOKEN
const user_name = process.env.USUARIO_NOME
const user_birthdate = process.env.USUARIO_DATA_NASCIMENTO
const user_cpf = process.env.USUARIO_CPF

// URL e rotas
const app = 'https://api-v2.idwall.co/'
const health_check = 'health'
const reports = 'relatorios'

// variaveis
const timeout = 60000
const invalid_name_message = "Inválido. [INVALID] Nome diferente do cadastrado na Receita Federal."
const invalid_birth_date_message = "Inválido. [ERROR] Não foi possível validar: Data de nascimento informada está divergente da constante na base de dados da Secretaria da Receita Federal do Brasil."

describe('GET /health', function() {
  it('responds with json', function(done) {
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

  context('sem utilizar token', () => {
    it('retorna Unauthorized status', function(done) {
      request(app)
        .post(reports)
        .send(payload)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401, done);
    });
  })

  context('utilizando token correto', () => {
    context('parametros vazios no payload', () => {
      it('retorna Bad Request error', function(done) {
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

    context('dados inconsistentes no payload', () => {
      context('data da nascimento divergente da base', () => {
        let report_id;
        let payload = {
          "matriz": "consultaPessoaDefault",
          "parametros": {
            "cpf_data_de_nascimento": "28/09/1988",
            "cpf_nome": user_name,
            "cpf_numero": user_cpf
          }
        }

        beforeEach(async () => {
          await request(app)
            .post(reports)
            .set('Authorization', my_token)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .timeout(timeout)
            .send(payload)
            .expect((res) => {
              report_id = res.body.result.numero;
              logger.info(report_id);
            })
            .expect(200);
          await sleep(60);
        });

        it('retorna mensagem de Data de Nascimento divergente', async () => {
          let count = 1;
          let resp;
          while(count < 10) {
            await sleep(60);
            logger.info('Consultando...');
            resp = await request(app)
                                .get(`${reports}/${report_id}`)
                                .set('Authorization', my_token)
                                .set('Content-Type', 'application/json')
                                .set('Accept', 'application/json')
                                .timeout(timeout)
                                .expect('Content-Type', /json/)
                                .expect(200);
            logger.info(`Retorno: ${resp.body.result.status}`);
            if(resp.body.result.status == 'CONCLUIDO') { count = 10; }
            count++;
          }
          expect(resp.body.result.mensagem).to.be.include(invalid_birth_date_message);
        })
      })

      context('nome divergente da base', () => {
        let report_id;
        let payload = {
          "matriz": "consultaPessoaDefault",
          "parametros": {
            "cpf_data_de_nascimento": "25/05/1987",
            "cpf_nome": "Gabriel Oliveira",
            "cpf_numero": "07614917677"
          }
        }

        beforeEach(async () => {
          await request(app)
            .post(reports)
            .set('Authorization', my_token)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .timeout(timeout)
            .send(payload)
            .expect((res) => {
              report_id = res.body.result.numero;
              logger.info(report_id);
            })
            .expect(200);
          await sleep(60);
        });

        it('retorna mensagem de Nome divergente', async () => {
          let count = 1;
          let resp;
          while(count < 10) {
            await sleep(60);
            logger.info('Consultando...');
            resp = await request(app)
                                .get(`${reports}/${report_id}`)
                                .set('Authorization', my_token)
                                .set('Content-Type', 'application/json')
                                .set('Accept', 'application/json')
                                .timeout(timeout)
                                .expect('Content-Type', /json/)
                                .expect(200);
            logger.info(`Retorno: ${resp.body.result.status}`);
            if(resp.body.result.status == 'CONCLUIDO') { count = 10; }
            count++;
          }
          expect(resp.body.result.mensagem).to.be.include(invalid_name_message);
        })
      })
    })

    context('dados reais de um usuário', () => {
      let report_id;
      let payload = {
        "matriz": "consultaPessoaDefault",
        "parametros": {
          "cpf_data_de_nascimento": user_birthdate,
          "cpf_nome": user_name,
          "cpf_numero": user_cpf
        }
      }

      beforeEach(async () => {
        await request(app)
          .post(reports)
          .set('Authorization', my_token)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .timeout(timeout)
          .send(payload)
          .expect((res) => {
            report_id = res.body.result.numero;
            logger.info(report_id);
          })
          .expect(200);
        await sleep(60);
      });

      it('retorna mensagem de sucesso na consulta', async () => {
        let count = 1;
        let resp;
        while(count < 10) {
          await sleep(60);
          logger.info('Consultando...');
          resp = await request(app)
                              .get(`${reports}/${report_id}`)
                              .set('Authorization', my_token)
                              .set('Content-Type', 'application/json')
                              .set('Accept', 'application/json')
                              .timeout(timeout)
                              .expect('Content-Type', /json/)
                              .expect(200);
          logger.info(`Retorno: ${resp.body.result.status}`);
          if(resp.body.result.status == 'CONCLUIDO') { count = 10; }
          count++;
        }
        expect(resp.body.result.resultado).to.be.equal('VALID');
      })
    })
  })
})

function sleep(s) {
  logger.info(`Esperando ${s} segundos`);
  ms = s * 1000;
  return new Promise(resolve => setTimeout(resolve, ms));
}
var nock = require('nock')
    , assert = require('assert')
    , Moip = require('..');

var moipConfig = {
    token: 'mockToken',
    key: 'mockKey',
    sandbox: true
};

var auth = new Buffer(moipConfig.token + ':' + moipConfig.key).toString('base64');

describe('callApi method', function () {
    it('should POST with correct header', function (done) {
        var mockResponse = { jjx: 'jjx' };

        var mockHttp = nock('https://desenvolvedor.moip.com.br')
            .matchHeader('Authorization', 'Basic ' + auth)
            .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
            .matchHeader('Content-Charset', 'text/xml;charset=UTF-8')
            .post('/sandbox/ws/alpha/just-for-check-header', {})
            .reply(200, mockResponse);

        var api = new Moip(moipConfig);

        api.postToApi('just-for-check-header', {}, function (err, res) {
            mockHttp.done();
            done();
        });
    });

    it('should return error when status is not 20*', function (done) {
        var mockResponse = '<Error>Mock<Error>';

        var mockHttp = nock('https://desenvolvedor.moip.com.br')
            .post('/sandbox/ws/alpha/not-200', {})
            .reply(400, mockResponse);


        var api = new Moip(moipConfig);

        api.postToApi('not-200', {}, function (err, res) {
            assert.equal(err.httpStatusCode, 400);
            assert.deepEqual(err.response, mockResponse);

            mockHttp.done();
            done();
        });
    });

    it('should make the request in production mode (not sandbox)', function (done) {
        var auth = new Buffer('mockToken:mockKey').toString('base64');

        var mockHttp = nock('https://moip.com.br')
            .matchHeader('Authorization', 'Basic ' + auth)
            .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
            .matchHeader('Content-Charset', 'text/xml;charset=UTF-8')
            .post('/ws/alpha/check-production-url', {})
            .reply(200);

        var api = new Moip({
            token: 'mockToken',
            key: 'mockKey'
        });

        api.postToApi('check-production-url', {}, function (err, res) {
            assert.equal(err, null);

            mockHttp.done();
            done();
        });
    });
});

describe('createPayment method', function () {
    it('should return error when payload does not begin with "EnviarInstrucao"', function (done) {
        var api = new Moip(moipConfig);

        api.createPayment({ mock: 'mock' }, function (err, res) {
            assert(err);
            done();
        });
    });

    it('should return parsed error when MoIP returns error', function (done) {
        var response = 
            '<ns1:EnviarInstrucaoUnicaResponse xmlns:ns1="https://www.moip.com.br/ws/alpha/">\
                <Resposta>\
                    <ID>200807231712344030000000000014</ID>\
                    <Status>Falha</Status>\
                    <Erro Codigo="102">Erro Msg</Erro>\
                </Resposta>\
            </ns1:EnviarInstrucaoUnicaResponse>';

        var mockHttp = nock('https://desenvolvedor.moip.com.br')
            .matchHeader('Authorization', 'Basic ' + auth)
            .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
            .matchHeader('Content-Charset', 'text/xml;charset=UTF-8')
            .post('/sandbox/ws/alpha/EnviarInstrucao/Unica', '<EnviarInstrucao><mock>mock</mock></EnviarInstrucao>')
            .reply(200, response);

        var api = new Moip(moipConfig);

        var payload = {
            EnviarInstrucao: {
                mock: 'mock'
            }
        };

        api.createPayment(payload, function (err, res) {
            assert.equal(err.code, '102');
            assert.equal(err.message, 'Erro Msg');

            mockHttp.done();
            done();
        });
    });

    it('should return a object with the "token", the "checkoutUrl" and the original "response"', function (done) {
        var mockResponse = 
            '<ns1:EnviarInstrucaoUnicaResponse xmlns:ns1="http://www.moip.com.br/ws/alpha/">\
                <Resposta>\
                    <ID>20120227112420640getPaymentInfo0000000335081</ID>\
                    <Status>Sucesso</Status>\
                    <Token>MOCK_TOKEN</Token>\
                </Resposta>\
            </ns1:EnviarInstrucaoUnicaResponse>';

        var mockHttp = nock('https://desenvolvedor.moip.com.br')
            .matchHeader('Authorization', 'Basic ' + auth)
            .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
            .matchHeader('Content-Charset', 'text/xml;charset=UTF-8')
            .post('/sandbox/ws/alpha/EnviarInstrucao/Unica', '<EnviarInstrucao><mock>mock</mock></EnviarInstrucao>')
            .reply(200, mockResponse);

        var api = new Moip(moipConfig);

        var payload = {
            EnviarInstrucao: {
                mock: 'mock'
            }
        };

        api.createPayment(payload, function (err, res) {
            assert.equal(res.token, 'MOCK_TOKEN');
            assert.equal(res.checkoutUrl, 'https://desenvolvedor.moip.com.br/sandbox/Instrucao.do?token=MOCK_TOKEN');
            assert.equal(res.xmlResponse, mockResponse);

            mockHttp.done();
            done();
        });
    });
});

describe('getPaymentInfo method', function () {
    it('should return do a GET to MoIP', function (done) {
        var mockResponse = 'mock response';

        var mockHttp = nock('https://desenvolvedor.moip.com.br')
            .matchHeader('Authorization', 'Basic ' + auth)
            .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
            .matchHeader('Content-Charset', 'text/xml;charset=UTF-8')
            .get('/sandbox/ws/alpha/ConsultarInstrucao/MOCK_TOKEN')
            .reply(200, mockResponse);

        var api = new Moip(moipConfig);

        api.getPaymentInfo('MOCK_TOKEN', function (err, res) {
            assert.equal(res, mockResponse);

            done();
        });
    });
});

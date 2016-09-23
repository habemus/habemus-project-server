// third-party dependencies
const amqp     = require('amqp');
const Bluebird = require('bluebird');

module.exports = function (app, options) {
  
  if (!options.rabbitMQURI) { throw new Error('rabbitMQURI is required'); }
  
  var rabbitMQService = {};
  app.services.rabbitMQ = rabbitMQService;
  
  return new Bluebird((resolve, reject) => {
    var conn = rabbitMQService.connection = amqp.createConnection({
      url: options.rabbitMQURI
    });
    
    conn.on('ready', _resolve);
    conn.on('error', _reject);
    
    function off() {
      conn.removeListener('ready', _resolve);
      conn.removeListener('error', _reject);
    }
    
    function _resolve() {
      off();
      resolve();
    }
    
    function _reject(err) {
      off();
      reject(err);
    }
  })
  .then(() => {
    
    var conn = rabbitMQService.connection;
    
    rabbitMQService.queues = {};
    
    // build up queues
    return Bluebird.all([
      // project-removal queue
      new Bluebird((resolve, reject) => {
        conn.queue('project-removal', (q) => {
          rabbitMQService.queues.projectRemoval = q;
          
          resolve();
        });
      }),
    ]);
    
  });
};
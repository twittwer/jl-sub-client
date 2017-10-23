'use strict';

require('native-promise-only');
const EventEmitter = require('event-emitter'),
  jlReceiver = require('jl-receiver');

/* -------------- */
/* --- Helper --- */
/* -------------- */

/* eslint-disable arrow-body-style */
const _defaultDataExtractor = dataPackage => ({ channel: dataPackage.channel, data: dataPackage.data });
const _isAcknowledge = dataPackage => dataPackage.name && dataPackage.name === 'acknowledge';
/* eslint-enable arrow-body-style */

/* -------------------------------- */
/* --- Configuration Management --- */
/* -------------------------------- */

const _preprocessRequestConfig = requestConfig => {
  if (typeof requestConfig !== 'object') {
    throw new Error('Missing Parameter: requestConfig is required');
  }

  if (requestConfig.channels) {
    if (!requestConfig.body) {
      requestConfig.body = { channels: requestConfig.channels };
    }
    if (!requestConfig.body.channels) {
      requestConfig.body.channels = requestConfig.channels;
    }
  }
};

const _preprocessModuleConfig = moduleConfig => {
  moduleConfig.dataExtractor = typeof moduleConfig.dataExtractor === 'function' ? moduleConfig.dataExtractor : _defaultDataExtractor;
  moduleConfig.isAcknowledgeFilter = _isAcknowledge;
};

/* ---------------------- */
/* --- Initialization --- */
/* ---------------------- */

const JlSubClient = function(requestConfig, moduleConfig) {
  this._config = {
    request: requestConfig,
    module: moduleConfig || {}
  };
};

JlSubClient.prototype.connect = function() {
  try {
    _preprocessRequestConfig(this._config.request);
    _preprocessModuleConfig(this._config.module);
  } catch (error) {
    return Promise.reject(error);
  }

  return jlReceiver.connect(this._config.request, this._config.module)
    .then(server => {
      const subServer = new EventEmitter();

      server.on('data', dataPackage => {
        const { channel, data } = this._config.module.dataExtractor(dataPackage);

        subServer.emit('data', channel, data);
      });
      /* eslint-disable arrow-body-style */
      server.on('disconnect', error => subServer.emit('disconnect', error));
      server.on('heartbeat', () => subServer.emit('heartbeat'));
      server.on('reconnect', () => subServer.emit('reconnect'));
      server.on('reconnected', () => subServer.emit('reconnected'));
      /* eslint-disable arrow-body-style */
      subServer.disconnect = server.disconnect;

      return subServer;
    });
};

/* -------------- */
/* --- Export --- */
/* -------------- */

module.exports = {
  connect: (requestConfig, moduleConfig) => {
    return (new JlSubClient(requestConfig, moduleConfig)).connect();
  }
};

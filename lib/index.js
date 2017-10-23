'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

require('native-promise-only');
var EventEmitter = require('event-emitter'),
    jlReceiver = require('jl-receiver');

var _defaultDataExtractor = function _defaultDataExtractor(dataPackage) {
  return { channel: dataPackage.channel, data: dataPackage.data };
};
var _isAcknowledge = function _isAcknowledge(dataPackage) {
  return dataPackage.name && dataPackage.name === 'acknowledge';
};


var _preprocessRequestConfig = function _preprocessRequestConfig(requestConfig) {
  if ((typeof requestConfig === 'undefined' ? 'undefined' : _typeof(requestConfig)) !== 'object') {
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

var _preprocessModuleConfig = function _preprocessModuleConfig(moduleConfig) {
  moduleConfig.dataExtractor = typeof moduleConfig.dataExtractor === 'function' ? moduleConfig.dataExtractor : _defaultDataExtractor;
  moduleConfig.isAcknowledgeFilter = _isAcknowledge;
};

var jlSubClient = function jlSubClient(requestConfig, moduleConfig) {
  var _this = this;

  this._config = {
    request: requestConfig,
    module: moduleConfig || {}
  };

  try {
    _preprocessRequestConfig(this._config.request);
    _preprocessModuleConfig(this._config.module);
  } catch (error) {
    return Promise.reject(error);
  }

  return jlReceiver.connect(this._config.request, this._config.module).then(function (server) {
    var subServer = new EventEmitter();

    server.on('data', function (dataPackage) {
      var _config$module$dataEx = _this._config.module.dataExtractor(dataPackage),
          channel = _config$module$dataEx.channel,
          data = _config$module$dataEx.data;

      subServer.emit('data', channel, data);
    });

    server.on('disconnect', function (error) {
      return subServer.emit('disconnect', error);
    });
    server.on('heartbeat', function () {
      return subServer.emit('heartbeat');
    });
    server.on('reconnect', function () {
      return subServer.emit('reconnect');
    });
    server.on('reconnected', function () {
      return subServer.emit('reconnected');
    });

    subServer.disconnect = server.disconnect;

    return subServer;
  });
};

module.exports = {
  connect: jlSubClient
};
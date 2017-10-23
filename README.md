# jl-sub-client

> Client for [Pub/Sub stream server](https://github.com:twittwer/jl-sub-server) based on [json-lines](https://github.com/thenativeweb/json-lines)

## Installation

`npm install git+ssh://git@github.com:twittwer/jl-sub-client.git`

## Usage

```javascript
const jlSubClient = require('jl-sub-client');

const requestConfig = {
    path: '/subscribe',
    channels: [ 'news', 'weather' ]
};

jlSubClient.connect(requestConfig)
    .then(server => { // connection established
        server.on('data', (channel, data) => {
            console.log(`${channel} update:`, data);
        });
        server.on('disconnect', (error) => {
            if (error) {
                console.log('connection abort caused by error:', error);
            } else {
                console.log('connection abort caused by server');
            }
        });
        // ...
        server.disconnect();
    })
    .catch(error => { // connection failed
        console.log('connection establishment failed', error);
    });
```

## Reference

> required **parameters** are written bold  
> optional *parameters* are written italic or marked with `[`square brackets`]`

### Methods

#### jlSubClient.connect(requestConfig, [moduleConfig]): Promise

Creates XHR based on request configuration and starts HTTP streaming.

| Param             | Type            | Sample                                           | Description                       |
| ----------------- | --------------- | ------------------------------------------------ | --------------------------------- |
| **requestConfig** | `requestConfig` | `{ 'path': '/subscribe', 'channels': ['news'] }` | definition for streaming request  |
| *moduleConfig*    | `moduleConfig`  | `{ 'connectionTimeoutInMS': 5000 }`              | configuration of request handling |

**Resolves** with connected server instance (`.then(server => {...})`)  
**Rejects** in cases of a failed connection attempt (`.catch(error => {...})`)

#### server.on(eventName, eventHandler): void

Registers handler/callback functions for connection events (`data`, `disconnect`).  
Internally there are more events emitted (`heartbeat`, ...), but they are mainly for administrative tasks only.

| Param            | Type       |
| ---------------- | ---------- |
| **eventName**    | `string`   |
| **eventHandler** | `function` |

| Event Name  | Handler Signature         | Description                                                               |
| ----------- | ------------------------- | ------------------------------------------------------------------------- |
| data        | `(channel, data) => void` | handler for incoming channel data (called multiple times)                 |
| disconnect* | `([error]) => void`       | callback for connection abort; error is undefined server-side disconnects |
|             |
| heartbeat   | `() => void`              | notifies about incoming heartbeats                                        |
| reconnect   | `() => void`              | notifies about initiated reconnect                                        |
| reconnected | `() => void`              | notifies about finished reconnect                                         |

> *) executes just once

#### server.removeListener(eventName, eventHandler): void

Removes listeners from prior event registration (`server.on(...)`).

| Param            | Type       |
| ---------------- | ---------- |
| **eventName**    | `string`   |
| **eventHandler** | `function` |

#### server.disconnect(): void

Closes server connection.

### Custom Type Definitions

#### `requestConfig` - Request Configuration

| Param        | Type       | Sample                                | Description                             |
| ------------ | ---------- | ------------------------------------- | --------------------------------------- |
| *ssl**       | `boolean`  | `true`                                | indicator to use http or https          |
| *host**      | `string`   | `'my-domain.com'`                     | define domain of targeted host          |
| *port**      | `number`   | `443`                                 | define port on targeted host            |
| **path**     | `string`   | `'/subscribe'`                        | path to access json-lines provider      |
| *headers*    | `object`   | `{ 'Authorization': 'Basic abc123' }` | map of http headers and their values    |
| *query*      | `object`   | `{ 'lastEvent': '1505077200' }`       | map of url query params and their value |
| *body***     | `object`   | `{ 'channels': ['news','weather'] }`  | http body (json only)                   |
| *channels*** | `string[]` | `['news','weather']`                  | shortcut to set `body.channels`         |

> *) as default `ssl`, `host`, `port` will be defined by current domain  
> **) if `channels` is defined, it will be set as `body.channels` (won't overwrite an existing `body.channels` property)

#### `moduleConfig` - Module Configuration

| Param                   | Type               | Default | Description                                                                                                                                                                                              |
| ----------------------- | ------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *dataExtractor*         | `function`         | (*)     | converter as counterpart of the `dataWrapper` in [jl-sub-server](https://github.com:twittwer/jl-sub-server)<br/>gets a data package and has to return an object with the properties `channel` and `data` |
| *connectionTimeoutInMS* | `number`           | `3000`  | time to wait before a connection attempt is evaluated as failed                                                                                                                                          |
| *reconnectTrigger*      | `reconnectTrigger` | `{...}` | configuration of internal/background reconnects                                                                                                                                                          |
| *reconnectAttemptLimit* | `number`           | `3`     | how many internal connection attempts are allowed                                                                                                                                                        |
| *reconnectWithHandover* | `boolean`          | `true`  | set true to establish new connection and synchronize before reconnect                                                                                                                                    |

> *) `(dataPackage) => boolean`

#### `reconnectTrigger` - Reconnect Trigger Configuration

| Param                    | Type      | Default | Description                                                        |
| ------------------------ | --------- | ------- | ------------------------------------------------------------------ |
| *failure*                | `boolean` | `true`  | reconnect if any error occurs                                      |
| *timeout*                | `boolean` | `true`  | reconnect after request timeout                                    |
| *disconnectByServer*     | `boolean` | `true`  | reconnect if server ends connection                                |
| *responseBufferSizeInMB* | `number`  | `50`    | reconnect after specific amount of data was received (fuzzy limit) |

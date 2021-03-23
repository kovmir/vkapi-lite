// Copyright 2021 Ivan Kovmir
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const EventEmitter = require('events');
const bent = require('bent');

// Extends EventEmitter to emit events from the long polling server.
class ClientInstance extends EventEmitter {
  constructor(options = {}) {
    super(); // Call EventEmitter's constructor.

    // typeof operator things arrays and nulls are objects as well.
    if (typeof options !== 'object' || Array.isArray(options) ||
        options === null) {
      throw new Error('Invalid options type! Required type: Object');
    }

    if (options.logger) {
      if (typeof options.logger !== 'function') {
        throw new Error('Invalid options.logger type! Required type: Function');
      }
    }

    // PRIVATE
    this._getJSON = bent('json');
    this._APIAddress = 'https://api.vk.com/method/';
    this._botPoll = false;

    // PUBLIC
    this.token = options.token || '';
    this.version = options.version || '5.125';
    this.logger = options.logger || console.log;
    this.debug = options.debug || false;
  }

  // PRIVATE METHODS

  // bent library does not allow you to pass URL params as an object, so I use
  // this function to construct a string of the params from the object.
  _buildURLParams(prefix, params) {
    let URLParams = prefix + '?';
    for (let key in params) {
      URLParams += key;
      URLParams += '='
      URLParams += params[key];
      URLParams += '&';
    }
    // Get rid of '&' at the end.
    return URLParams.substring(0, URLParams.length-1);
  }

  // Fetches updates from the polling server.
  async _getUpdates (lpsAddress, lpsParams, params) {
    this.debug && this.logger('[lp request]', lpsAddress, lpsParams);

    const reqURL = `${lpsAddress}${this._buildURLParams('', lpsParams)}`;
    let respObj;
    try {
      respObj = await this._getJSON(reqURL);
    } catch (err) {
      this.debug && this.logger('[lp error]', err);
      this.startBotPolling(params);
    }

    this.debug && this.logger('[lp response]', lpsAddress, respObj);

    if (respObj.updates) {
      // Possible update types: https://vk.com/dev/groups_events
      for (const update of respObj.updates) {
        this.emit(update.type, update);
      }

      if (this._botPoll) {
        lpsParams.ts = respObj.ts;
        this._getUpdates(lpsAddress, lpsParams, params);
      }
      return;
    }

    // Possible errors: https://vk.com/dev/bots_longpoll?f=2.2.%20%D0%9E%D1%88%D0%B8%D0%B1%D0%BA%D0%B8
    if (respObj.failed) {
      switch (respObj.failed) {
        case 1:
          lpsParams.ts = respObj.ts;
          this._getUpdates(lpsAddress, lpsParams, params);
          break;
        case 2: case 3:
          this.startBotPolling(params);
          break;
      }
    }
    // VK API is so horrible that it can return anything: an empty string, an
    // invalid JSON, etc. Thus I put this statement here to prevent sudden
    // failures with no reason.
    this.startBotPolling(params);
  };

  // PUBLIC METHODS

  // Use this to call methonds.
  async callMethod(methodName, params = {}) {
    if (typeof methodName !== 'string') {
      throw new Error('Invalid methodName type! Required type: String');
    }

    // typeof operator things arrays and nulls are objects as well.
    if (typeof params !== 'object' || Array.isArray(params) ||
        params === null) {
      throw new Error('Invalid options type! Required type: Object');
    }

    this.debug && this.logger('[call method]', methodName, params);

    params.access_token = params.access_token || this.token;
    params.v = params.v || this.version;

    const reqURL = `${this._APIAddress}${this._buildURLParams(methodName, params)}`;
    const respObj = await this._getJSON(reqURL);
    return respObj.response || respObj.error;
  }

  // Starts Bots Long Poll.
  // https://vk.com/dev/bots_longpoll
  async startBotPolling(params = {}) {
    if (typeof params !== 'object' || Array.isArray(params) ||
        params === null) {
      throw new Error('Invalid params type! Required type: Object');
    }

    const lps = await this.callMethod('groups.getLongPollServer', {
      group_id: 195124061,
    });
    const lpsAddress = lps.server;
    const lpsParams = {
      act: 'a_check',
      key: lps.key,
      ts: lps.ts,
      wait: params.wait || 25,
    };

    this._botPoll = true;
    this._getUpdates(lpsAddress, lpsParams, params);
  }

  // Waits unitl the last request gets fulfilled and stops Bots Long Poll.
  stopBotPolling() {
    this._botPoll = false;
  }
}

module.exports = ClientInstance;

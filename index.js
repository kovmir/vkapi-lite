const request = require('request-promise-native');
const EventEmitter = require('events');

class UserInstance extends EventEmitter {
  constructor(options = {}) {
    super();

    if (typeof options !== 'object' || Array.isArray(options) || options === null) {
      throw new Error('Invalid options type! Required type: Object');
    }

    if (options.logger) {
      if (typeof options.logger !== 'function') {
        throw new Error('Invalid options.logger type! Required type: Function');
      }
    }

    this.token = options.token || '';
    this.version = options.version || '5.68';
    this.logger = options.logger;
    this.debug = options.debug;
  }

  callMethod(methodName, params = {}) {
    if (typeof methodName !== 'string') {
      throw new Error('Invalid methodName type! Required type: String');
    }

    this.debug && this.logger && this.logger('[call method]', methodName, params);

    params.access_token = params.access_token || this.token;
    params.v = params.v || this.version;

    return request({
      uri: `https://api.vk.com/method/${methodName}`,
      qs: params,
      json: true
    }).then((response) => {
      this.debug && this.logger && this.logger('[method response]', methodName, response);

      if (response.response) {
        return Promise.resolve(response.response);
      }
      
      if (response.error) {
        return Promise.reject(new Error(response.error.error_msg));
      }

      return Promise.resolve(response);
    });
  }

  startPolling(params = {}) {
    if (typeof params !== 'object' || Array.isArray(params) || params === null) {
      throw new Error('Invalid params type! Required type: Object');
    }

    const event = new Map([
      [1, 'replaceMessageFlags'],
      [2, 'installMessageFlags'],
      [3, 'resetMessageFlags'],
      [4, 'newMessage'],
      [6, 'readAllIncomingMessages'],
      [7, 'readAllOutgoingMessages'],
      [8, 'friendIsOnline'],
      [9, 'friendIsOffline'],
      [10, 'resetDialogFlags'],
      [11, 'replaceDialogFlags'],
      [12, 'installDialogFlags'],
      [13, 'deleteAllMessages'],
      [51, 'conversationContentOrTopicChange'],
      [61, 'userTypingInDialog'],
      [62, 'userTypingInConversation'],
      [70, 'userCompleteCall'],
      [80, 'newUnreadMessageCounter'],
      [114, 'notificationSettingsChange']
    ]);

    const getUpdates = (lpsAddress, lpsParams) => {
      this.debug && this.logger && this.logger('[lp request]', lpsAddress, lpsParams);

      request({
        uri: lpsAddress,
        qs: lpsParams,
        json: true
      }).then((response) => {
        this.debug && this.logger && this.logger('[lp response]', lpsAddress, response);

        if (response.updates) {
          for (const update of response.updates) {
            this.emit(event.get(update[0]), update);
          }

          if (this._polling) {
            lpsParams.ts = response.ts;
            getUpdates(lpsAddress, lpsParams);
          }

          return;
        }

        if (response.failed) {
          switch (response.failed) {
            case 1:
              lpsParams.ts = response.ts;
              getUpdates(lpsAddress, lpsParams);
              break;
            case 2: case 3:
              this.startPolling(params);
              break;
            case 4:
              lpsParams.version = response.max_version;
              getUpdates(lpsAddress, lpsParams);
              break;
          }

          return;
        }

        this.startPolling(params);
      }).catch(() => {
        this.startPolling(params);
      });
    };

    this.callMethod('messages.getLongPollServer', {
      need_pts: 0,
      lp_version: params.lp_version || 2
    }).then((lps) => {
      const lpsAddress = `https://${lps.server}`;
      const lpsParams = {
        act: 'a_check',
        key: lps.key,
        ts: lps.ts,
        wait: params.wait || 25,
        mode: params.mode || 2,
        version: params.version || 2
      };

      this._polling = true;

      getUpdates(lpsAddress, lpsParams);
    });
  }

  stopPolling() {
    this._polling = false;
  }
}

module.exports = UserInstance;


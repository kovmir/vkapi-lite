# vkapi-lite
Lite VK API wrapper for Node.JS

## Installation
```
npm install vkapi-lite
```

## Usage example
```javascript
const UserInstance = require('vkapi-lite');

const client = new UserInstance({
  token: 'YOUR_TOKEN', //default: '' (empty string)
  debug: true,         //default: false
  logger: console.log, //if debug true
});

client.callMethod('users.get', {
  user_ids: 1,
  fields: 'screen_name',
}).then(console.log);

client.on('newMessage', (event) => {
  console.log(`${event[3]}: ${event[5]}`);

  client.stopPolling();
});

client.startPolling();
```

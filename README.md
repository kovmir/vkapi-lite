# vkapi-lite

[![NPM](https://nodei.co/npm/vkapi-lite.png)](https://nodei.co/npm/vkapi-lite/)

Lite VK API wrapper for Node.JS

## INSTALLATION
```
npm install vkapi-lite
```

# USAGE EXAMPLE

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

# LICENSE
Copyright 2020 Ivan Kovmir

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

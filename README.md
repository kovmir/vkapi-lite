# vkapi-lite

[![NPM](https://nodei.co/npm/vkapi-lite.png)](https://nodei.co/npm/vkapi-lite/)

Lite VK API wrapper for Node.JS

## INSTALLATION

```
npm install vkapi-lite
```

# USAGE EXAMPLE

```javascript
const ClientInstance = require('vkapi-lite');

const client = new ClientInstance({
  token: '',           // default: '' (empty string)
  debug: true,         // default: false
  logger: console.log, // if debug true
  version: 5.125,      // default 5.125
});

// The old way.
client.callMethod('users.get', {
  user_ids: 1,
  fields: 'screen_name',
}).then(console.log);

// Modern async/await way.
const getUserName = async function fetchUserNameById(id) {
  const user = await client.callMethod('users.get', {
    user_ids: id,
  })
  console.log(user[0].first_name);
};

getUserName(1);


// Possible events: https://vk.com/dev/groups_events
client.on('wall_post_new', (event) => {
  console.log(event);
  client.stopBotPolling();
});

// Bots Long Poll: https://vk.com/dev/bots_longpoll
client.startBotPolling();
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

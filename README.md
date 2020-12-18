
- main.js, index.html
  - in addition to the electron basics, these also include functionality for:
    - responding to custom web protocol
    - creating and listening via a socket.io server
    - getting local os stats to pass to socket.io client
- `yarn init -y`
- in package.json
  - change `index.js` to `main.js` in package.json
  - add
    ```json
    "build": {
      "appId": "du-hello-electron-builder",
      "mac": {
        "category": "du.app.category.type"
      },
      "protocols": {
        "name": "du-electron-protocol",
        "schemes": [
          "du-scheme"
        ]
      }
    }
    ```
  - add:
    ```json
    "scripts": {
      "start": "electron .",
      "pack": "electron-builder --dir",
      "dist": "electron-builder"
    }
    ```
- `yarn add -D electron electron-builder`
- `yarn add os-utils express socket.io`
- `yarn dist`
- installer and standalone exe are in dist dir
- run the installer
- first verify that custom web protocol is working
    - navigate from browser to `du-scheme://foo?bar=baz`
    - navigate from browser to `du-scheme://foo?one=two`
- now run web-protocol-react-socket-client to connect to socket server herein
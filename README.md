# hw-app-nano-sample

This project demonstrates how to use the [hw-app-nano](https://github.com/roosmaa/hw-app-nano/) library to interact with the $NANO wallet application on Ledger devices.

The U2F protocol is used to communicate with the dongle. For now, only Google Chrome (version 38 or later) and Opera (version 40 or later) support the U2F protocol. And to use it, the site needs to be served over HTTPS. That is the reason why the development server is setup to use a self-signed certificate.

In order to run this application you need to have Nano node RPC running on `localhost:7076`. If you have it running on some other machine or port you can modify the reverse proxy in `packages.json`.

To get started clone both hw-app-nano-sample and hw-app-nano repositories into the same directory, as such:

```
$ mkdir ledger-nano; cd ledger-nano
$ git clone https://github.com/roosmaa/hw-app-nano-sample.git
$ git clone https://github.com/roosmaa/hw-app-nano.git
```

To build & run the demo project:

```
$ cd hw-app-nano/
$ npm install
$ npm run build
$ cd ../hw-app-nano-sample/
$ npm install
$ HTTPS=true npm run start
```

And then navigate to https://localhost:3000/ and dismiss the warning about the self-signed certificate.
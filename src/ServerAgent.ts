import RemoteServer from './RemoteServer.js';

export default class ServerAgent {
  #server: RemoteServer;

  constructor(server: RemoteServer) { this.#server = server; }

  getHostName(): string { return this.#server.getName(); }
  getHostAddress(): string { return this.#server.getAddress(); }
  getServer(): RemoteServer { return this.#server; }
}

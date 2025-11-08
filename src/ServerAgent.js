export default class ServerAgent {
  #server;

  constructor(server) { this.#server = server; }

  getHostName() { return this.#server.getName(); }
  getHostAddress() { return this.#server.getAddress(); }
  getServer() { return this.#server; }
};

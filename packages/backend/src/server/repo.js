const { Key } = require('interface-datastore/key');
const { FsDatastore } = require('datastore-fs');

const apiKey = new Key("api");

module.exports = class Repo {
  constructor({ repoPath }) {
    if (!repoPath) {
      throw new Error("Repo requires repoPath option");
    }

    this.root = new FsDatastore(repoPath, {
      extension: ''
    });
  }

  async init({ port, host }) {
    try {
      
      await this.root.open();
      await this.root.put(apiKey, Buffer.from(JSON.stringify({ port, host })));

    } catch (err) {
      
      try { await this.close(); } catch(err) {}
    }
  }

  async close() {
    try { await this.root.delete(apiKey) } catch (err) { log("failed to remove api lock", err); }
    try { await this.root.close(); } catch (err) { log("failed to close root datastore", err); }
  }
}
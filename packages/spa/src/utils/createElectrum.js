// Load the electrum library.
import { ElectrumCluster, ElectrumTransport } from "electrum-cash";

export default function createElectrum(servers = [], { confidence = 1, timeout = 60000, name, version = "1.4.1", distribution, order } = {}) {

  // Initialize an electrum cluster with default settings.
  const electrum = new ElectrumCluster(name, version, confidence, distribution, order, timeout)

  // Add some servers to the cluster.
  const transports = Object.values(ElectrumTransport)
  
  if (!servers.length) {
    throw new Error("Invalid electrum servers");
  }
  
  servers.map(async ({ address, port, scheme }) => {
    if (!port && scheme) {
      const transport = transports.find(t => t.Scheme === scheme);
      port = port || transport && transport.Port;
    }
    try {
      return await electrum.addServer(address, port, scheme);
    } catch (err) {
      console.log("Electrum startup error: " + scheme + "://" + address + ":" + port, err)
    }
  });

  return electrum
};
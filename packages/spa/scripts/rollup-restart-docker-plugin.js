import { execaSync } from "execa";
import path from "path";

export default function restartDockerCompose({ name } = {}) {
  const pluginName = 'restartDockerCompose';
  return {
    name: pluginName,
    writeBundle: {
      sequential: true,
      order: 'post',
      handler: async (options) => { 

        if (!name) {
          console.error("Failed to restart docker: no project name argument provided");
        }

        try {
          
          execaSync('docker', ['compose', 'restart', name], {
            localDir: path.resolve(process.cwd(), "../..")
          });
          console.log("Successfully restarted docker");

        } catch (error) {

          console.log("Error restarting docker application", error);
        }
      }
    }
  }
};
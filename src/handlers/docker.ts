import * as Dockerode from "dockerode";
import * as stream from "node:stream";
import { logger } from "../utils/logger";

// command to test: docker exec rad radtest test test123 127.0.0.1 1812 testing123

// function delay(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }
/**
 * Provides function interacting with the docker daemon
 * @class
 */
class DockerAPI {
  private sys: Dockerode;
  private logStreams: Record<string, stream.PassThrough> = {};
  private containerStreams: Record<string, boolean> = {};
  private containerStops: Record<string, number> = {};

  constructor() {
    this.sys = new Dockerode({
      socketPath: "/var/run/docker.sock",
    });
  }

  async getContainerList() {
    //return also stopped containers
    return this.sys.listContainers({ all: true });
  }

  async startContainer(id: string): Promise<void> {
    const container = this.sys.getContainer(id);
    if (!container) throw new Error("Container not found");
    await container.start();
    await this.startLogs(id, container);
  }

  async stopContainer(id: string): Promise<unknown> {
    const container = this.sys.getContainer(id);
    if (!container) throw new Error("Container not found");
    //safe stop date for restarting logs
    this.containerStops[id] = Date.now();
    return container.stop();
  }

  async restartContainer(id: string): Promise<void> {
    const container = this.sys.getContainer(id);
    if (!container) throw new Error("Container not found");
    //safe stop date for restarting logs
    this.containerStops[id] = Date.now();
    await container.restart();
    await this.startLogs(id, container);
  }

  async startLogs(
    id: string,
    container: Dockerode.Container,
    tail = 9,
  ): Promise<void> {
    if (this.containerStreams[id]) return;
    if (!this.logStreams[id]) this.logStreams[id] = new stream.PassThrough();
    logger.debug("exec logs logStream");
    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: tail,
      since: (this.containerStops[id] || 1000) / 1000,
    });
    this.containerStreams[id] = true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    container.modem.demuxStream(
      logStream,
      this.logStreams[id],
      this.logStreams[id],
    );
    logStream.on("end", () => {
      logger.debug("log stream of docker ends (docker exit?)...");
      this.containerStreams[id] = false;
    });
  }

  async startTrailing(id: string): Promise<stream.PassThrough> {
    const container = this.sys.getContainer(id);
    if (!container) throw new Error("Container not found");
    // create a single stream for stdin and stdout
    if (!this.logStreams[id]) this.logStreams[id] = new stream.PassThrough();

    await this.startLogs(id, container, 771);
    return this.logStreams[id];
  }
}

export const dockerAPI = new DockerAPI();

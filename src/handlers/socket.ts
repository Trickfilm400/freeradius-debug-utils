import { dockerAPI } from "./docker";
import { logger } from "../utils/logger";
import { io } from "../index";
import { process_lines } from "../lib/processing";
import { abstractData } from "../lib/abstractData";

export function getContainerList() {
  //todo: implement
}
export function startContainer(container: string, cb: (res: boolean) => void) {
  logger.debug("startContainer", container);
  dockerAPI
    .startContainer(container)
    .then(() => {
      cb(true);
    })
    .catch((err) => {
      cb(false);
      logger.error(err);
    });
}

export function stopContainer(container: string, cb: (res: boolean) => void) {
  logger.debug("stopContainer", container);
  dockerAPI
    .stopContainer(container)
    .then(() => {
      cb(true);
    })
    .catch((err) => {
      cb(false);
      logger.error(err);
    });
}
export function restartContainer(
  container: string,
  cb: (res: boolean) => void,
) {
  logger.debug("restartContainer", container);
  dockerAPI
    .restartContainer(container)
    .then(() => {
      cb(true);
    })
    .catch((err) => {
      cb(false);
      logger.error(err);
    });
}
//map: safe if logging for a container is started to prevent messages be sent multiple times
const logMap: Record<string, boolean> = {};
export async function logStream(container: string, cb: (res: boolean) => void) {
  logger.debug("Log Stream", container);
  const logStream = await dockerAPI.startTrailing(container);
  //buffer to reduce socket messages
  let buffer: string[] = [];
  let timeout: NodeJS.Timeout | undefined;
  //listen only once on this "data" event, otherwise data will be send x-times to clients...
  if (!logMap[container])
    logStream.on("data", (data: Buffer) => {
      //prevent multiple listener per container
      logMap[container] = true;
      buffer.push(data.toString());
      //region raw_buffer
      if (buffer.length > 100) {
        //send buffer
        io.emit("logStream", buffer);
        //clear buffer
        buffer = [];
        //cancel any pending buffer sends
        clearTimeout(timeout);
        timeout = undefined;
      } else if (!timeout) {
        timeout = setTimeout(() => {
          io.emit("logStream", buffer);
          buffer = [];
          timeout = undefined;
        }, 100);
      }
      //endregion raw_buffer
      //process data by line
      const processedData = process_lines(data.toString().split("\n"));
      //region abstract_data
      const ids = Object.keys(processedData);
      ids.forEach((id) => {
        io.emit("logProcessingAbstract", id, abstractData(processedData[id]));
      });
      //endregion abstract_data
      //send line-processed data
      io.emit("logProcessing", processedData);
    });
  cb(true);
}

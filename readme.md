# freeradius-debug-utils

This project is for debugging freeradius configurations. This docker container will get the radius logs and parse them,
so they are easily readable on the corresponding web page. It exposes a Socket.IO server which could be used standalone,
but is indented to be used with the corresponding [radius-webadmin](https://github.com/Trickfilm400/radius-webadmin)
project. This project has a debug page to view the logs prettified.

## Usage

To use this container, you need to pass through the docker socket on the server, where the freeradius container is
running which you want to debug. (No remote/cluster support currently.). You can try to use it read-only, but then the
container control options (start/stop) will not work.

docker-compose example:

```yaml
services:
  freeradius-debug-server:
    image: ghcr.io/trickfilm400/freeradius-debug-utils:latest
    ports:
      - 3000:3000
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

**Note**: You have to enable the **debug mode** for your freeradius server on your own. Add `-X` to you start command and
verify that in the logs there are debug information printed. This project excepts you to do this on your own, as every
setup is individual.

After the container started, go to the [radius-webadmin](https://github.com/Trickfilm400/radius-webadmin) debug page and
enter the Socket.IO address of this container. (Hint: If the container are on the same compose stack / host you probably
don't need the port forward and simply use the container name instead of the IP).
After you entered the connection info, you should be able to connect to the server and see incoming requests.

&copy; 2025

Created with ♥ by [typescript-project-scaffolding](https://github.com/Trickfilm400/typescript-project-scaffolding)
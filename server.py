# encoding: utf-8

import os
import docker
from docker.errors import ImageNotFound, NotFound, DockerException
import tornado.web
import tornado.httpserver
import tornado.ioloop
import tornado.gen
from tornado.log import app_log as log
from tornado.options import define, options
from wsrpc import WebSocketRoute, WebSocketThreaded as WebSocket, wsrpc_static

define("listen", default='localhost')
define("port", default=9090, type=int)


class App(tornado.web.Application):

    def __init__(self):
        project_root = os.path.dirname(os.path.abspath(__file__))
        handlers = (
            wsrpc_static(r'/js/(.*)'),
            (r"/ws/", WebSocket),
            (r'/(.*)', tornado.web.StaticFileHandler, {
                'path': os.path.join(project_root, 'static'),
                'default_filename': 'index.html',
            }),
        )
        super().__init__(handlers=handlers)


CLIENT = docker.from_env()


class Routes(WebSocketRoute):

    def run(self, image_id):
        log.info('method: run; image_id: {0}'.format(image_id))
        try:
            container = CLIENT.containers.run(image_id, detach=True)
        except ImageNotFound:
            return 'image {0} not found'.format(image_id)
        except DockerException:
            return 'docker error'
        return "Container {0} was successfully runned".format(container.short_id)

    def start(self, container_id):
        log.info('method: start; container_id: {0}'.format(container_id))
        try:
            container = CLIENT.containers.get(container_id)
            container.start()
        except NotFound:
            return 'container {0} not found'.format(container_id)
        except DockerException:
            return 'docker error'
        return "Container {0} was successfully started".format(container_id)

    def stop(self, container_id):
        log.info('method: stop; container_id: {0}'.format(container_id))
        try:
            container = CLIENT.containers.get(container_id)
            container.stop()
        except NotFound:
            return 'container {0} not found'.format(container_id)
        except DockerException:
            return 'docker error'
        return "Container {0} was successfully stopped".format(container_id)

    def remove(self, container_id):
        log.info('method: remove; container_id: {0}'.format(container_id))
        try:
            container = CLIENT.containers.get(container_id)
            container.remove()
        except NotFound:
            return 'container {0} not found'.format(container_id)
        except DockerException:
            return 'docker error'
        return "Container {0} was successfully deleted".format(container_id)


class APIRoutes(WebSocketRoute):

    def get_images(self):
        all_images = CLIENT.images.list()
        return {i.short_id: str(i).replace('<', '').replace('>', '') for i in all_images}

    def get_containers(self):
        started_containers = CLIENT.containers.list()
        all_containers = CLIENT.containers.list(all=True)
        return {c.short_id: 'started' if c in started_containers else 'stopped' for c in all_containers}


WebSocket.ROUTES['docker'] = Routes

WebSocket.ROUTES['api'] = APIRoutes


def start_server():
    options.parse_command_line()
    WebSocket.init_pool()
    http_server = tornado.httpserver.HTTPServer(App())
    http_server.listen(options.port, address=options.listen)
    log.info('Server started {host}:{port}'.format(host=options.listen, port=options.port))
    tornado.ioloop.IOLoop.instance().start()

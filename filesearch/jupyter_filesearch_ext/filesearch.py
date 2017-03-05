import os, ujson
from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler

class JupyterFileSearchExtension(IPythonHandler):

    def __init__(self, *args):
        super(JupyterFileSearchExtension, self).__init__(*args)
        self.working_dir       = os.path.abspath('.')
        self.ignore_extensions = { '.pyc', '.png', 'jpg', '.jpeg', '.log' }

    def should_ignore(self, name):
        if name.startswith('.'):
            return True

        ext = name[name.rfind('.'):]
        if ext in self.ignore_extensions:
            return True

        return False

    def set_default_headers(self):
        super(JupyterFileSearchExtension, self).set_default_headers()
        self.set_header('Content-Type', 'application/json')

    def get(self):
        files = []

        for dirpath, dirnames, filenames in os.walk(self.working_dir):
            i = 0
            while i < len(dirnames):
                if self.should_ignore(dirnames[i]):
                    del dirnames[i]
                else:
                    i += 1

            i = 0
            while i < len(filenames):
                if self.should_ignore(filenames[i]):
                    del filenames[i]
                else:
                    i += 1

            for dname in dirnames:
                files.append({
                    'path': os.path.join(dirpath, dname).replace(self.working_dir, ''),
                    'type': 'dir' 
                })
            for fname in filenames:
                files.append({
                    'path': os.path.join(dirpath, fname).replace(self.working_dir, ''),
                    'type': 'file' 
                })

        self.finish(ujson.dumps(files))

def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    route_pattern = url_path_join(web_app.settings['base_url'], '/api/project_structures')
    web_app.add_handlers(host_pattern, [(route_pattern, JupyterFileSearchExtension)])
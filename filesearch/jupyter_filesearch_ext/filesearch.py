import os, ujson, re
from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler

class JupyterFileSearchExtension(IPythonHandler):

    def __init__(self, *args):
        super(JupyterFileSearchExtension, self).__init__(*args)
        self.working_dir = os.path.abspath('.')
        self.search_config = {
            'ignore_extensions': { '.pyc', '.png', 'jpg', '.jpeg', '.log' },
            'ignore_names': set(),
            'ignore_folders': set(),
            'ignore_regex': []
        }

        config_file = os.path.join(self.working_dir, 'filesearch.config.json')

        if os.path.exists(config_file):
            with open(config_file, 'rb') as f:
                config = ujson.loads(f.read())
            self.search_config.update(config)

        assert len(set(self.search_config.keys()).difference({ 'ignore_folders', 'ignore_extensions', 'ignore_names', 'ignore_regex' })) == 0, 'Invalid configuration file'
        self.search_config['ignore_extensions'] = set(self.search_config['ignore_extensions'])
        self.search_config['ignore_folders'] = set([os.path.abspath(x) for x in self.search_config['ignore_folders']])
        self.search_config['ignore_names'] = set(self.search_config['ignore_names'])
        self.search_config['ignore_regex'] = [re.compile(x) for x in self.search_config['ignore_regex']]

    def should_ignore_name(self, name):
        if name.startswith('.'):
            return True

        ext = name[name.rfind('.'):]
        if ext in self.search_config['ignore_extensions']:
            return True

        if name in self.search_config['ignore_names']:
            return True

        return False

    def should_ignore_folder(self, dpath):
        return dpath in self.search_config['ignore_folders']

    def should_ignore_regex(self, path):
        path = path.replace(self.working_dir, '')
        return any((r.match(path) is not None for r in self.search_config['ignore_regex']))

    def set_default_headers(self):
        super(JupyterFileSearchExtension, self).set_default_headers()
        self.set_header('Content-Type', 'application/json')

    def get(self):
        files = []

        for dirpath, dirnames, filenames in os.walk(self.working_dir):
            i = 0
            while i < len(dirnames):
                dpath = os.path.abspath(os.path.join(dirpath, dirnames[i]))
                if self.should_ignore_name(dirnames[i]) or self.should_ignore_folder(dpath) or self.should_ignore_regex(dpath):
                    del dirnames[i]
                else:
                    files.append({
                        'path': dpath.replace(self.working_dir, ''),
                        'type': 'dir' 
                    })
                    i += 1

            i = 0
            while i < len(filenames):
                fpath = os.path.abspath(os.path.join(dirpath, filenames[i]))
                if self.should_ignore_name(filenames[i]) or self.should_ignore_regex(fpath):
                    del filenames[i]
                else:
                    files.append({
                        'path': fpath.replace(self.working_dir, ''),
                        'type': 'file' 
                    })
                    i += 1

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

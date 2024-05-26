import shutil

import folder_paths
import os
import hashlib
import json

class LoadFile:
    '''
    文件加载器，文件上传到输入目录
    '''
    CATEGORY = "work_utils/input"

    # 常量，使用本地文件
    USE_LOCAL_FILE = "USE_LOCAL_FILE"

    @classmethod
    def INPUT_TYPES(s):
        input_dir = folder_paths.get_input_directory()
        files = [f for f in os.listdir(input_dir) if os.path.isfile(os.path.join(input_dir, f))]
        return {
            "required": {
                "file": ([s.USE_LOCAL_FILE] + sorted(files), {"file_upload": True, "accept": "*"}),
            },
            "optional": {
                "local_file": ("STRING", {"multiline": True, "default": ""}),
            },
        }

    RETURN_TYPES = ("FILE",)

    FUNCTION = "load_file"

    def load_file(self, file, local_file):
        if file == LoadFile.USE_LOCAL_FILE:
            file_path = local_file
        else:
            file_path = folder_paths.get_annotated_filepath(file)
        if not os.path.isfile(file_path):
            raise Exception(f"非法文件:{file_path}")
        return (file_path,)

    @classmethod
    def IS_CHANGED(s, file):
        if file == s.USE_LOCAL_FILE:
            return s.USE_LOCAL_FILE
        file_path = folder_paths.get_annotated_filepath(file)
        m = hashlib.sha256()
        with open(file_path, 'rb') as f:
            m.update(f.read())
        return m.digest().hex()

    @classmethod
    def VALIDATE_INPUTS(s, file):
        if file == LoadFile.USE_LOCAL_FILE:
            return True
        if not folder_paths.exists_annotated_filepath(file):
            return f"非法文件:{file}"
        return True

class UnzipFile:
    '''
    解压文件
    '''
    CATEGORY = "work_utils/handler"

    # 支持的压缩包类型
    SUPPORT_TYPES = ("zip",)

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "file": ("FILE",),
            },
            "optional": {
                "output_dir": ("STRING", {"multiline": True, "default": ""}),
            }
        }

    RETURN_TYPES = ("DIR",)

    FUNCTION = "unzip"

    def unzip(self, file, output_dir):
        if not os.path.isfile(file) or not file.split('.')[-1] in UnzipFile.SUPPORT_TYPES:
            raise Exception(f"文件不存在或者压缩类型不支持:{file}")
        if len(output_dir) == 0:
           output_dir = folder_paths.get_input_directory()
        unzip_dir = os.path.join(output_dir, os.path.splitext(os.path.basename(file))[0])
        shutil.unpack_archive(file, unzip_dir)
        return (unzip_dir,)

    @classmethod
    def IS_CHANGED(s, file,):
        return file

class ListDir:
    CATEGORY = "work_utils/handler"

    @classmethod
    def INPUT_TYPES(s):
        # 参数可以加一些exclude之类的，或者指定后缀
        return {
            "required": {
                "dir": ("DIR",),
            },
        }

    RETURN_TYPES = ("JSON",)

    FUNCTION = "list_dir"

    def list_dir(self, dir):
        if not os.path.isdir(dir):
            raise Exception(f"文件夹不存在:{dir}")
        data = json.loads('{"a":{"b":1},"c":2,"d":"hello"}')
        return (data,)

    @classmethod
    def IS_CHANGED(s, dir,):
        return dir

class ReadTexts:
    '''
    从文本文件中读取文本
    1. 默认就是读取整个文件
    2. 支持正则提取关键文本
    参数：
    {tag:目标正则}
    输出:
    {tag:内容} JSON
    '''
    pass

class HttpRequest:
    '''
    http请求，
    返回的数据格式为JSON类型，数据合法判断：
    1、由下一个处理节点自行判断是否符合，IS_CHANGED
    2、output_required属性规定类型
    '''
    CATEGORY = "work_utils/input"

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "url": ("STRING", {"multiline": True, }),
                "type": (("GET", "POST"), {"default": "GET"}),
                "headers": ("STRING", {"multiline": True, "default": ""}),
                "output_required": ("STRING", {"multiline": True, "default": ""}),
            },
        }

    RETURN_TYPES = ("JSON",)

    FUNCTION = "request"

    def request(self, url, type, headers, output_required):
        return ({"url": url},)

class TablePreview:
    CATEGORY = "work_utils/preview"

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "dir": ("DIR",),
            },
            "optional": {
                "data": ("JSON",),
            },
        }

    RETURN_TYPES = ()

    FUNCTION = "output"

    OUTPUT_NODE = True

    def output(self, dir, data={}):
        results = list()
        results.append({
            "filename": 'ComfyUI_00001_.png',
            "subfolder": '',
            "type": 'output'
        })
        results.append({
            "filename": 'ComfyUI_00001_.png',
            "subfolder": '',
            "type": 'output'
        })
        print('output,', dir, data)
        # output的节点输出一定要是ui
        return {"ui": data}

class TextPreview:
    # monaco editor
    pass

class JsonPreview:
    # monaco json editor
    # https://microsoft.github.io/monaco-editor/playground.html
    # https://jsonpath.com/
    CATEGORY = "work_utils/preview"

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "data": ("JSON",),
            },
        }

    RETURN_TYPES = ()

    FUNCTION = "output"

    OUTPUT_NODE = True

    def output(self, data):
        # 格式固定
        return {"ui": {"data": (json.dumps(data),) }}

# converter
# 保证自定义类型X,必有XtoJson, 且ReadJson必有ToX
# 在此基础上提供直接转换，如StringToFile,FileToString
class ReadJson:
    '''
    https://jsonpathfinder.com/
    https://jsonpath.com/
    从json中读取项，万能转换器
    输出有多项，只有对应可以输出的才有正确输出
    JSON、STRING、NUMBER、FILES、FILE、DIR
    '''
    pass

class FileToJson:
    pass

class FilesToJson:
    pass


NODE_CLASS_MAPPINGS = {
    "LoadFile": LoadFile,

    "UnzipFile": UnzipFile,
    "ListDir": ListDir,

    "HttpRequest": HttpRequest,
    "TablePreview": TablePreview,
    "JsonPreview": JsonPreview,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "LoadFile": "LoadFile",
    "UnzipFile": "UnzipFile",
    "ListDir": "ListDir",
    "HttpRequest": "HttpRequest",
    "TablePreview": "TablePreview",
    "JsonPreview": "JsonPreview",
}

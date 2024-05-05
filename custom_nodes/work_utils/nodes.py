import folder_paths
import os
import hashlib
import json


class LoadFile:
    '''
    文件加载器，文件上传到临时目录处理
    '''
    CATEGORY = "work_utils/input"

    @classmethod
    def INPUT_TYPES(s):
        input_dir = folder_paths.get_input_directory()
        files = [f for f in os.listdir(input_dir) if os.path.isfile(
            os.path.join(input_dir, f))]
        return {"required":
            {
                "file": (sorted(files),),
            },
        }

    RETURN_TYPES = ("DIR",)

    FUNCTION = "load_file"

    def load_file(self, file):
        file_path = folder_paths.get_annotated_filepath(file)
        return (file_path,)

    @classmethod
    def IS_CHANGED(s, file):
        file_path = folder_paths.get_annotated_filepath(file)
        m = hashlib.sha256()
        with open(file_path, 'rb') as f:
            m.update(f.read())
        return m.digest().hex()

    @classmethod
    def VALIDATE_INPUTS(s, file):
        if not folder_paths.exists_annotated_filepath(file):
            return "Invalid file: {}".format(file)

        return True


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


class UnzipFile:
    '''
    解压文件
    '''
    pass


class TextExtract:
    '''
    文本提取器
    '''

    CATEGORY = "work_utils/handler"

    @classmethod
    def INPUT_TYPES(s):
        return {"required":
            {
                # 文件夹，默认会遍历文件夹下所有文件
                "dir": ("STRING", {"default": "", }),
                # 文件名过滤，支持正则
                "file_filter": ("STRING", {"default": "", }),
                # 需要提取的目标，e.g. {cpu: ["xxcpu:(\w+),xx", 1], gpu: ["xxgpu:(\w+),xx", 1]}
                "targets": ("STRING", {"multiline": True, "default": ""}),
                # 后处理，python代码，对后处理数据再进一步提纯整合，也可以考虑单独弄成一个节点
                "post_handler": ("STRING", {"multiline": True, "default": ""}),
            },
        }

    RETURN_TYPES = ("JSON",)

    FUNCTION = "extract"

    def extract(self):
        # 返回数据可能还需要进一步处理
        # e.g. { cpu:["i7-8700", "i7-8700"], gpu:["rtx-1060"] }
        return {}

    @classmethod
    def IS_CHANGED(s, dir, file_filter):
        # 遍历文件夹下所有满足条件的文件，hash相加成字符串
        # 或者处理条件变了
        return ""

    @classmethod
    def VALIDATE_INPUTS(s, file):
        # 判断文件夹是否存在，是否至少有一个符合条件的文件存在
        return True


class TextOutput:
    CATEGORY = "work_utils/output"

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
        return {"ui": data }


NODE_CLASS_MAPPINGS = {
    "LoadFile": LoadFile,
    "HttpRequest": HttpRequest,
    "TextOutput": TextOutput,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "LoadFile": "LoadFile",
    "HttpRequest": "HttpRequest",
    "TextOutput": "TextOutput"
}

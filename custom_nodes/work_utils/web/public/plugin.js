import { app } from '/scripts/app.js'
import { api } from '/scripts/api.js'

// 颜色参考，https://vuetifyjs.com/en/styles/colors/#material-colors
const COLORS = {
  JSON: '#F44336',
  DIR: '#673AB7',
}

class Logger {
  constructor(name) {
    this.name = name
  }

  info(...msgs) {
    console.log(`[${this.name}] [info]`, ...msgs)
  }

  debug(...msgs) {
    console.log(`[${this.name}] [debug]`, ...msgs)
  }

  error(...msgs) {
    console.log(`[${this.name}] [error]`, ...msgs)
  }
}

const logger = new Logger('WorkUtils')

// 节点颜色
app.registerExtension({
  name: 'WorkUtils.Colors',
  async init(app) {
    logger.info('导入脚本、样式')
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = '/extensions/work_utils/index.js'
    document.head.appendChild(script)

    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = '/extensions/work_utils/index.css'
    document.head.appendChild(link)
  },
  async setup(app) {
    logger.info('设置颜色')
    Object.assign(app.canvas.default_connection_color_byType, COLORS)
    Object.assign(LGraphCanvas.link_type_colors, COLORS)
  },
  async getCustomWidgets(app) {
    logger.info('加载自定义Widget')
    return {
      FILEUPLOAD(node, inputName, inputData, app) {
        const attrs = inputData[1] || {}
        const accept = attrs.accept || '*'
        const fileWidget = node.widgets.find((w) => w.name === attrs.widget)
        if (!fileWidget) {
          logger.error('未找到关联的widget', attrs.widget)
          return
        }
        let uploadWidget

        const default_value = fileWidget.value
        Object.defineProperty(fileWidget, 'value', {
          set: function (value) {
            this._real_value = value
          },

          get: function () {
            let value = ''
            if (this._real_value) {
              value = this._real_value
            } else {
              return default_value
            }

            if (value.filename) {
              let real_value = value
              value = ''
              if (real_value.subfolder) {
                value = real_value.subfolder + '/'
              }

              value += real_value.filename

              if (real_value.type && real_value.type !== 'input') value += ` [${real_value.type}]`
            }
            return value
          },
        })

        async function uploadFile(file, updateNode, pasted = false) {
          try {
            // Wrap file in formdata so it includes filename
            const body = new FormData()
            body.append('image', file)
            if (pasted) body.append('subfolder', 'pasted')
            const resp = await api.fetchApi('/upload/image', {
              method: 'POST',
              body,
            })

            if (resp.status === 200) {
              const data = await resp.json()
              // Add the file to the dropdown list and update the widget value
              let path = data.name
              if (data.subfolder) path = data.subfolder + '/' + path

              if (!fileWidget.options.values.includes(path)) {
                fileWidget.options.values.push(path)
              }

              if (updateNode) {
                fileWidget.value = path
              }
            } else {
              alert(resp.status + ' - ' + resp.statusText)
            }
          } catch (error) {
            alert(error)
          }
        }

        const fileInput = document.createElement('input')
        Object.assign(fileInput, {
          type: 'file',
          accept,
          style: 'display: none',
          onchange: async () => {
            if (fileInput.files.length) {
              await uploadFile(fileInput.files[0], true)
            }
          },
        })
        document.body.append(fileInput)

        // Create the button widget for selecting the files
        uploadWidget = node.addWidget('button', inputName, 'choose_file_to_upload', () => {
          fileInput.click()
        })
        uploadWidget.label = 'choose file to upload'
        uploadWidget.serialize = false

        // Add handler to check if an image is being dragged over our node
        node.onDragOver = function (e) {
          if (e.dataTransfer && e.dataTransfer.items) {
            const image = [...e.dataTransfer.items].find((f) => f.kind === 'file')
            return !!image
          }
          return false
        }

        node.onDragDrop = function (e) {
          let handled = false
          for (const file of e.dataTransfer.files) {
            logger.info('文件类型', file.type)
            if (accept === '*' || accept.split(',').some((a) => file.type.startsWith(a))) {
              uploadFile(file, !handled) // Dont await these, any order is fine, only update on first one
              handled = true
            }
            else {
              logger.info(`require ${accept}, but got ${file.type}`)
            }
          }
          return handled
        }

        node.onRemoved = function (e) {
          fileInput.remove()
        }

        // TODO: 目前不兼容, 详情查看pasteFiles事件的来源
        node.pasteFile = function (file) {
          return false
        }

        return { widget: uploadWidget }
      },
    }
  },
})

// 加载文件
app.registerExtension({
  name: 'WorkUtils.LoadFile',
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== 'LoadFile') {
      return
    }
    /**
     * 可以针对该节点定义的输入进行修改，如修改（增删）其widget类型，以及参数
     * 但是此处拿不到其widget的输入，如果要做应该在widget内部是实现，传递回调进去
     */
    if (!nodeData.input) {
      nodeData.input = {}
    }
    if (!nodeData.input.required) {
      nodeData.input.required = {}
    }
    if (!nodeData.input.optional) {
      nodeData.input.optional = {}
    }
    const inputs = { ...nodeData.input.optional, ...nodeData.input.required }
    Object.keys(inputs).forEach((key) => {
      const item = inputs[key]
      // [0]为可选项或输入类型，[1]为参数
      const attrs = item[1]
      if (attrs?.file_upload) {
        // 如果有参数file_upload则新增一个上传组件的输入
        nodeData.input.optional[`${key}_upload`] = ['FILEUPLOAD', { widget: key, accept: attrs.accept }]
      }
    })

    nodeType.prototype.onAdded = function (graph) {
      this.setSize([300, 100])
    }
  },
})

app.registerExtension({
  name: 'WorkUtils.TextOutput',
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== 'TextOutput') {
      return
    }
    const root = document.createElement('div')
    root.id = 'WorkUtils'
    nodeType.prototype.onAdded = function (graph) {
      const widget = this.addDOMWidget('$$preview_table', 'textoutput', root, {
        hideOnZoom: false,
        // 目前好像只能定义最小高度，宽度搞不了
        getMinHeight: () => 100,
      })
      widget.serializeValue = () => undefined
      // 设置初始宽高
      this.setSize([420, 300])
      globalThis.createTable(`#${root.id}`)
      logger.debug('render', this, widget)
    }

    const onExecutedOriginal = nodeType.prototype.onExecuted
    nodeType.prototype.onExecuted = function (data) {
      onExecutedOriginal?.apply(this, arguments)
      logger.info('data', data)
      logger.info('node', this)
      // todo: 更新ui界面
    }
  },
})

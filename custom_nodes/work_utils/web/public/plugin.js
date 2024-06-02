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

  warn(...msgs) {
    console.log(`[${this.name}] [warn]`, ...msgs)
  }

  error(...msgs) {
    console.log(`[${this.name}] [error]`, ...msgs)
  }
}

class Utils {
  static genID() {
    return Math.random().toString(36).slice(2)
  }

  static getJson(str) {
    let data = {}
    try {
      data = JSON.parse(str)
    } catch (error) {
      logger.error('parse json failed', str)
    }
    return data
  }

  static importJS({ src, type = 'text/javascript' }, callback) {
    const script = document.createElement('script')
    script.type = type
    script.src = src
    script.onload = () => {
      callback?.()
    }
    document.head.appendChild(script)
  }

  static importCSS(href) {
    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }

  static inlineStyle(styles) {
    const style = document.createElement('style')
    style.innerText = styles
    document.head.append(style)
  }
}

const NodeHelper = {
  Preview: class {
    constructor(nodeType, id = Utils.genID()) {
      const divEle = document.createElement('div')
      divEle.id = id
      const widget = nodeType.addDOMWidget(id, id, divEle, {
        hideOnZoom: false,
        getMinHeight: () => 100,
      })
      widget.serializeValue = () => undefined

      this._widget = widget
      this._id = id
      this._$el = divEle
    }

    get widget() {
      return this._widget
    }

    get id() {
      return this._id
    }

    get $el() {
      return this._$el
    }
  },

  SplitPreview: class {
    constructor(nodeType, { idLeft = Utils.genID(), idRight = Utils.genID(), ratio = [0.5, 0.5] } = {}) {
      if (!ratio[1]) {
        ratio[1] = 1 - ratio[0]
      }
      Utils.inlineStyle(this.getStyle(ratio))

      const divWrapper = document.createElement('div')
      divWrapper.className = 'split-preview'
      const divLeft = document.createElement('div')
      divLeft.id = idLeft
      divLeft.className = 'left'
      const divRight = document.createElement('div')
      divRight.id = idRight
      divRight.className = 'right'
      divWrapper.appendChild(divLeft)
      divWrapper.appendChild(divRight)

      const widget = nodeType.addDOMWidget(idLeft, idLeft, divWrapper, {
        hideOnZoom: false,
        getMinHeight: () => 250,
      })
      widget.serializeValue = () => undefined

      this._widget = widget
      this._id = idLeft
      this._idLeft = idLeft
      this._idRight = idRight
      this._$el = divWrapper
      this._$elLeft = divLeft
      this._$elRight = divRight
    }

    getStyle(ratio) {
      return `
        .split-preview {
          display: flex;
        }
        .split-preview .left {
          width: ${ratio[0] * 100}%;
        }
        .split-preview .right {
          width: ${ratio[1] * 100}%
        }
      `
    }

    get widget() {
      return this._widget
    }

    get id() {
      return this._id
    }

    get idLeft() {
      return this._idLeft
    }

    get idRight() {
      return this._idRight
    }

    get $el() {
      return this._$el
    }

    get $elLeft() {
      return this._$elLeft
    }

    get $elRight() {
      return this._$elRight
    }
  },
}

class MonacoHelper {
  load() {
    const monacoCDN = 'https://unpkg.com/monaco-editor@0.49.0'
    this._ready = new Promise((resolve, reject) => {
      Utils.importJS({ src: `${monacoCDN}/min/vs/loader.js` }, () => {
        require.config({ paths: { vs: `${monacoCDN}/min/vs` } })
        require(['vs/editor/editor.main'], () => {
          this.init()
          resolve()
        })
      })
    })

    globalThis.MonacoEnvironment = {
      getWorkerUrl: function (workerId, label) {
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
          self.MonacoEnvironment = {
            baseUrl: '${monacoCDN}/min/'
          };
          importScripts('${monacoCDN}/min/vs/base/worker/workerMain.js');`)}`
      },
    }
  }

  init() {
    this.registerLogLang()
    this.setTheme()
  }

  setTheme() {
    const theme = 'workutils-dark'

    monaco.editor.defineTheme(theme, {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'custom-info', foreground: 'BDBDBD' },
        { token: 'custom-error', foreground: 'EF9A9A', fontStyle: 'bold' },
        { token: 'custom-date', foreground: 'A5D6A7' },
      ],
      colors: {},
    })

    monaco.editor.setTheme(theme)
  }

  registerLogLang() {
    const lang = 'workutils-text'

    monaco.languages.register({ id: lang })
    monaco.languages.setMonarchTokensProvider(lang, {
      tokenizer: {
        root: [
          [/\[error.*/, 'custom-error'],
          [/\[info.*/, 'custom-info'],
          [/\[[a-zA-Z 0-9:]+\]/, 'custom-date'],
        ],
      },
    })
  }

  addFilesChangeCommand(editor, files) {
    const lang = 'workutils-text'
    const id = 'file_change'

    const str = Object.values(files)[0]
    editor?.getModel()?.setValue(str)

    if (this._addedFilesChangeCommandDisPose) {
      this._addedFilesChangeCommandDisPose.forEach((item) => item.dispose())
    }
    this._addedFilesChangeCommandDisPose = [
      monaco.languages.registerCodeLensProvider(lang, {
        provideCodeLenses: function (model, token) {
          return {
            lenses: Object.keys(files).map((filename) => ({
              range: {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 2,
                endColumn: 1,
              },
              id,
              command: {
                id,
                title: filename,
                arguments: [files[filename]],
              },
            })),
            dispose: () => {},
          }
        },
        resolveCodeLens: function (model, codeLens, token) {
          return codeLens
        },
      }),
      monaco.editor.addCommand({
        id,
        run: function (_, content) {
          // 更新编辑的文本内容
          editor.getModel().setValue(content)
        },
      }),
    ]
  }

  get ready() {
    return this._ready
  }
}

const logger = new Logger('WorkUtils')
const _m = new MonacoHelper()

// 通用
app.registerExtension({
  name: 'WorkUtils.Common',
  async init(app) {
    logger.info('导入脚本、样式')
    Utils.importJS({ src: '/extensions/work_utils/index.js', type: 'module' })
    Utils.importCSS('/extensions/work_utils/assets/index.css')

    logger.info('导入monaco')
    _m.load()
  },
  async setup(app) {
    logger.info('设置颜色')
    Object.assign(app.canvas.default_connection_color_byType, COLORS)
    Object.assign(LGraphCanvas.link_type_colors, COLORS)
  },
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (!nodeData.category?.startsWith('work_utils/')) {
      return
    }
    nodeType.prototype.onAdded = function (graph) {
      // 默认宽高
      this.setSize([300, 100])
    }
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
            } else {
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

// load file
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
  },
})

// table preview
app.registerExtension({
  name: 'WorkUtils.TablePreview',
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== 'TablePreview') {
      return
    }
    nodeType.prototype.onAdded = function (graph) {
      const preview = new NodeHelper.Preview(this)
      this.setSize([420, 300])
      _web.table(`#${preview.id}`)
      logger.debug('render', this, preview.widget)
    }

    const onEx = nodeType.prototype.onExecuted
    nodeType.prototype.onExecuted = function (data) {
      onEx?.apply(this, arguments)
      logger.info('data', data)
      logger.info('node', this)
    }
  },
})

// json preview
app.registerExtension({
  name: 'WorkUtils.JsonPreview',
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== 'JsonPreview') {
      return
    }
    nodeType.prototype.myData = {}
    nodeType.prototype.onAdded = async function (graph) {
      const preview = new NodeHelper.Preview(this)
      this.setSize([300, 250])
      await _m.ready
      const editor = monaco.editor.create(preview.$el, {
        language: 'json',
        minimap: { enabled: false },
        scrollbar: { horizontal: 'hidden' },
      })
      this.myData = {
        preview,
        editor,
      }
    }
    const onEx = nodeType.prototype.onExecuted
    nodeType.prototype.onExecuted = function (result) {
      onEx?.apply(this, arguments)
      const str = result?.data?.[0]
      const data = Utils.getJson(str)
      const { editor } = this.myData
      editor?.getModel()?.setValue(JSON.stringify(data, null, 2))
    }

    const onResize = nodeType.prototype.onResize
    nodeType.prototype.onResize = function (size) {
      onResize?.apply(this, arguments)
      const { editor } = this.myData
      editor?.layout()
    }
  },
})

// text preview
app.registerExtension({
  name: 'WorkUtils.TextPreview',
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== 'TextPreview') {
      return
    }
    // 全局弹窗挂载点
    const dialogEle = document.createElement('div')
    dialogEle.id = Utils.genID()
    document.body.append(dialogEle)
    let dialog
    setTimeout(async () => {
      dialog = await _web.textPickDialog(`#${dialogEle.id}`, {
        onSave({ name, matchType, context } = {}) {
          const { editor, jsonEditor } = context || {}
          if (!name || !matchType || !editor || !jsonEditor) {
            logger.warn('name or matchType or editor or jsonEditor is required')
            return
          }
          const selection = editor.getSelection()
          const text = editor.getModel().getValueInRange(selection)
          let json = jsonEditor.getModel().getValue() || '{}'
          try {
            json = JSON.parse(json)
          } catch (error) {
            json = {}
            logger.warn('json is invalid')
            // json解失败可能用户正在编辑
            return
          }
          if (!json[name]) {
            json[name] = {}
          }
          json[name][matchType.toLowerCase()] = text.replace(/([\{\}\[\]\(\)])/g, '\\$1')
          jsonEditor.getModel().setValue(JSON.stringify(json, null, 2))
        },
      })
    }, 200)

    nodeType.prototype.myData = {}
    const onAdded = nodeType.prototype.onAdded
    nodeType.prototype.onAdded = async function (graph) {
      const preview = new NodeHelper.SplitPreview(this, { ratio: [0.65] })
      this.setSize([300, 250])
      await _m.ready
      const editor = monaco.editor.create(preview.$elLeft, {
        language: 'workutils-text',
        readOnly: true,
      })
      const jsonEditor = monaco.editor.create(preview.$elRight, {
        language: 'json',
        minimap: { enabled: false },
        scrollbar: { horizontal: 'hidden' },
      })
      this.myData = {
        preview,
        editor,
        jsonEditor,
        layout() {
          editor.layout()
          jsonEditor.layout()
        },
      }
      setTimeout(this.myData.layout, 200)
      return onAdded?.apply(this, arguments)
    }

    const onExecuted = nodeType.prototype.onExecuted
    nodeType.prototype.onExecuted = function (result) {
      const files = result?.data?.[0]
      const { editor, jsonEditor } = this.myData
      // 加载文件
      _m.addFilesChangeCommand(editor, files)
      // 右键挑选文本
      const actionId = 'pick_match_item'
      if (!editor.getAction(actionId)) {
        editor.addAction({
          id: 'pick_match_item',
          label: 'Pick Match Item',
          contextMenuGroupId: 'navigation',
          contextMenuOrder: 1.5,
          run: (ed) => {
            let json = jsonEditor?.getModel().getValue() || '{}'
            try {
              json = JSON.parse(json)
            } catch (error) {
              json = {}
            }
            dialog?.open(this.myData, Object.keys(json))
          },
        })
      }
      return onExecuted?.apply(this, arguments)
    }

    const onResize = nodeType.prototype.onResize
    nodeType.prototype.onResize = function (size) {
      this.myData?.layout?.()
      return onResize?.apply(this, arguments)
    }

    const getExtraMenuOptions = nodeType.prototype.getExtraMenuOptions
    nodeType.prototype.getExtraMenuOptions = function (_, options) {
      options.push({
        content: this.myData.fullScreen ? 'Restore' : 'Zoom',
        callback: () => {
          this.myData.fullScreen = !this.myData.fullScreen
          if (this.myData.fullScreen) {
            this.myData.lastSize = this.size
            this.myData.lastPos = this.pos
            this.setSize([1000, 750])
            this.pos = [200, 50]
          } else {
            this.setSize(this.myData.lastSize)
            this.pos = this.myData.lastPos
          }
          setTimeout(() => this.myData?.layout?.(), 200)
        },
      })
      return getExtraMenuOptions?.apply(this, arguments)
    }
  },
})

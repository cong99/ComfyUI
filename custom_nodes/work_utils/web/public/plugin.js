import { app } from '/scripts/app.js'

// 颜色参考，https://vuetifyjs.com/en/styles/colors/#material-colors
const COLORS = {
  JSON: '#F44336',
  DIR: '#673AB7',
}

// 节点颜色
app.registerExtension({
  name: 'WorkUtils.Colors',
  async init(app) {
    console.log('[WorkUtils] 导入脚本、样式')
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = '/extensions/work_utils/index.js'
    document.head.appendChild(script)

    const link = document.createElement('link')
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = '/extensions/work_utils/index.css'
    document.head.appendChild(link)
  },
  async setup(app) {
    console.log('[WorkUtils] 设置颜色')
    Object.assign(app.canvas.default_connection_color_byType, COLORS)
    Object.assign(LGraphCanvas.link_type_colors, COLORS)
  },
  // async getCustomWidgets(app) {
  //   console.log('[logging]', 'provide custom widgets')
  //   return {
  //     JSON: (node, inputName, inputData, app) => {
  //       console.log(getCustomWidgets,,,,,,,,,,,,,,,,', inputName, inputData)
  //       return {
  //         widget: node.addWidget('toggle', inputName, false, () => {}, {on: '开', off: '关'}),
  //       }
  //     },
  //   }
  // },
})

// 加载文件
app.registerExtension({
  name: 'WorkUtils.LoadFile',
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== 'LoadFile') {
      return
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
    let count = 0

    nodeType.prototype.onAdded = function (graph) {
      const widget = this.addDOMWidget('$$preview_table', 'textoutput', root, {
        hideOnZoom: false,
        // 目前好像只能定义最小高度，宽度搞不了
        getMinHeight: () => 100,
      })
      widget.serializeValue = () => undefined
      // 设置初始宽高
      this.setSize([420, 300])
      globalThis.createTable('#WorkUtils')
      console.log('render123==========', this, widget)
    }

    const onExecutedOriginal = nodeType.prototype.onExecuted
    nodeType.prototype.onExecuted = function (data) {
      onExecutedOriginal?.apply(this, arguments)
      console.log('data', data)
      console.log('node', this)
      // todo: 更新ui界面
    }
  },
})

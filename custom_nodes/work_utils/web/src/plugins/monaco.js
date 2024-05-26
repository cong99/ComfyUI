import * as monaco from 'monaco-editor/esm/vs/editor/editor.main'

// 将worker.js拷贝到public，TODO: 后续自动化实现
// node_modules/monaco-editor/esm/vs/editor/editor.worker.js
// node_modules/monaco-editor/esm/vs/language/json/json.worker.js

globalThis.MonacoEnvironment = {
  getWorkerUrl: function(workerId, label) {
    return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
      self.MonacoEnvironment = {
        baseUrl: 'https://unpkg.com/monaco-editor@latest/min/'
      };
      importScripts('https://unpkg.com/monaco-editor@latest/min/vs/base/worker/workerMain.js');`
    )}`;
  }
};

globalThis.monaco = monaco

<template>
  <div class="tex-editor">
    <div ref="editor" class="editor-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";

const props = defineProps({
  initialValue: {
    type: String,
    default:
      "\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}",
  },
});

const emit = defineEmits(["update:content", "compile"]);

const editor = ref(null);
let editorView = null;

// 创建编辑器
const createEditor = () => {
  if (!editor.value) return;

  // 更完整的编辑器配置
  const startState = EditorState.create({
    doc: props.initialValue,
    extensions: [
      keymap.of([indentWithTab]), // 允许使用Tab键缩进
      keymap.of(defaultKeymap), // 添加默认按键映射
      EditorView.lineWrapping, // 自动换行
      oneDark, // 主题
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit("update:content", update.state.doc.toString());
        }
      }),
    ],
  });

  editorView = new EditorView({
    state: startState,
    parent: editor.value,
  });
};

// 更新编辑器内容
const updateContent = (content) => {
  if (editorView) {
    const transaction = editorView.state.update({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content,
      },
    });
    editorView.dispatch(transaction);
  }
};

// 在组件挂载后创建编辑器
onMounted(() => {
  createEditor();
});

// 在组件卸载前销毁编辑器
onUnmounted(() => {
  if (editorView) {
    editorView.destroy();
  }
});

// 暴露方法供父组件调用
defineExpose({
  updateContent,
});
</script>

<style scoped>
.tex-editor {
  height: 100%;
  width: 100%;
}

.editor-container {
  height: 100%;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: auto;
}
</style>
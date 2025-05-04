<template>
  <div class="pdf-viewer">
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    <div v-else-if="!pdfUrl" class="no-preview">
      <p>请编译TeX代码以预览PDF</p>
    </div>
    <div v-else class="pdf-container">
      <div class="page-controls" v-if="numPages > 1">
        <el-button size="small" :disabled="currentPage <= 1" @click="prevPage"
          >上一页</el-button
        >
        <span>{{ currentPage }} / {{ numPages }}</span>
        <el-button
          size="small"
          :disabled="currentPage >= numPages"
          @click="nextPage"
          >下一页</el-button
        >
      </div>
      <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import * as pdfjsLib from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const props = defineProps({
  pdfUrl: {
    type: String,
    default: "",
  },
});

const pdfCanvas = ref(null);
const loading = ref(false);
const error = ref(null);
const currentPage = ref(1);
const numPages = ref(0);
const scale = ref(1.5);
let pdfDoc = null;
let renderTask = null;

// 渲染PDF页面
const renderPage = async (pageNum) => {
  if (!pdfDoc) return;

  const canvas = pdfCanvas.value;
  if (!canvas) {
    console.error("Canvas 元素未找到");
    return;
  }

  try {
    const containerWidth = canvas.parentElement.clientWidth || 800;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const scaleRatio = containerWidth / viewport.width; // 计算缩放比例
    const scaledViewport = page.getViewport({ scale: scaleRatio });

    const context = canvas.getContext("2d");
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    if (renderTask) {
      renderTask.cancel();
    }

    renderTask = page.render({
      canvasContext: context,
      viewport: scaledViewport,
    });

    await renderTask.promise;

    currentPage.value = pageNum;
  } catch (err) {
    console.error("渲染PDF页面失败:", err);
    error.value = "渲染PDF页面失败";
  }
};

// 加载PDF文档
const loadPdf = async (url) => {
  loading.value = true;
  error.value = null;

  try {
    const pdfUrl = `${url}?t=${new Date().getTime()}`;
    pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
    numPages.value = pdfDoc.numPages;

    // 设置 loading 为 false，确保 template 中 canvas 能被渲染
    loading.value = false;

    // 等待 DOM 更新
    await nextTick();

    // 再调用渲染方法
    await renderPage(1);
  } catch (err) {
    console.error("加载PDF文档失败:", err);
    loading.value = false;
    error.value = `加载PDF失败: ${err.message || "未知错误"}`;
    ElMessage.error("无法加载PDF文档");
  }
};

// 翻到上一页
const prevPage = () => {
  if (currentPage.value <= 1) return;
  currentPage.value--;
  renderPage(currentPage.value);
};

// 翻到下一页
const nextPage = () => {
  if (currentPage.value >= numPages.value) return;
  currentPage.value++;
  renderPage(currentPage.value);
};

// 监听pdfUrl的变化
watch(
  () => props.pdfUrl,
  async (newUrl) => {
    if (newUrl) {
      await nextTick(); // 等待DOM更新，确保canvas已挂载
      loadPdf(newUrl);
    }
  }
);

// 组件挂载后加载PDF
onMounted(async () => {
  if (props.pdfUrl) {
    await nextTick();
    loadPdf(props.pdfUrl);
  }
});
</script>

<style scoped>
.pdf-viewer {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: auto;
  background-color: #f9f9f9;
  padding: 10px;
}

.pdf-canvas {
  max-width: 100%;
  height: auto;
  background-color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.loading,
.error,
.no-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.error {
  color: #f56c6c;
}

.no-preview {
  color: #909399;
  background-color: #f5f7fa;
}
</style>
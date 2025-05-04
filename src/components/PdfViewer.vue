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
import { ref, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import * as pdfjsLib from "pdfjs-dist";

// 确保使用相同版本的worker
// 注意：版本号需要与安装的pdfjs-dist版本一致，根据错误信息应该是5.2.133
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker/pdf.worker.min.mjs";

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

  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: scale.value });

    const canvas = pdfCanvas.value;
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // 取消之前的渲染任务
    if (renderTask) {
      renderTask.cancel();
    }

    // 创建新的渲染任务
    renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
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
    console.log("开始加载PDF文档:", url);
    // 对URL进行缓存破坏，避免浏览器缓存导致问题
    const pdfUrl = `${url}?t=${new Date().getTime()}`;
    // 加载PDF文档
    pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
    console.log("PDF文档加载成功, 页数:", pdfDoc.numPages);
    numPages.value = pdfDoc.numPages;

    // 渲染第一页
    await renderPage(1);
    loading.value = false;
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
  (newUrl) => {
    if (newUrl) {
      loadPdf(newUrl);
    }
  }
);

// 组件挂载后加载PDF
onMounted(() => {
  if (props.pdfUrl) {
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
  padding: 20px;
  background-color: #f9f9f9;
}

.pdf-canvas {
  margin-top: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: white;
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
<template>
  <div class="home">
    <!-- <div class="header">
      <h1>TeX在线编辑器</h1>
    </div> -->

    <div class="main-content">
      <div class="editor-section">
        <div class="section-header">
          <h2>TeX编辑器</h2>
          <el-button type="primary" @click="compileTeX" :loading="compiling"
            >编译</el-button
          >
        </div>
        <div class="editor-container">
          <TexEditor
            ref="texEditor"
            :initial-value="texCode"
            @update:content="updateTexCode"
          />
        </div>
      </div>

      <div class="preview-section">
        <div class="section-header">
          <h2>PDF预览</h2>
        </div>
        <PdfViewer v-if="pdfUrl" :pdf-url="pdfUrl" />
        <div v-else class="no-preview">
          <p>请编译TeX代码以预览PDF</p>
        </div>
      </div>
    </div>

    <StatusBar
      :status="status"
      :message="statusMessage"
      @download="downloadPdf"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import TexEditor from "@/components/TexEditor.vue";
import PdfViewer from "@/components/PdfViewer.vue";
import StatusBar from "@/components/StatusBar.vue";
import api from "@/services/api";

// 状态变量
const texCode = ref(
  "\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}"
);
const texEditor = ref(null);
const pdfUrl = ref("");
const pdfId = ref("");
const status = ref("idle");
const statusMessage = ref("就绪");
const compiling = ref(false);

// 更新TeX代码
const updateTexCode = (newCode) => {
  texCode.value = newCode;
};

// 编译TeX代码
const compileTeX = async () => {
  if (!texCode.value.trim()) {
    ElMessage.warning("请输入TeX代码");
    return;
  }

  compiling.value = true;
  status.value = "loading";
  statusMessage.value = "正在编译...";

  try {
    const response = await api.compileTeX(texCode.value);

    if (response.data.success) {
      // 编译成功
      pdfId.value = response.data.pdf_id;

      // 生成完整的预览URL，包括时间戳以避免缓存问题
      const timestamp = new Date().getTime();
      pdfUrl.value = `${api.getPdfPreviewUrl(pdfId.value)}?t=${timestamp}`;

      status.value = "success";
      statusMessage.value = "编译成功";
      ElMessage.success("TeX编译成功");
    } else {
      // 编译失败
      status.value = "error";
      statusMessage.value = `编译失败: ${response.data.error || "未知错误"}`;
      ElMessage.error(statusMessage.value);
      pdfUrl.value = ""; // 清空URL
    }
  } catch (error) {
    // 请求错误
    console.error("编译请求失败:", error);
    status.value = "error";

    if (error.response && error.response.data) {
      statusMessage.value = `编译失败: ${
        error.response.data.error || "未知错误"
      }`;
    } else {
      statusMessage.value = "编译失败: 网络错误";
    }

    ElMessage.error(statusMessage.value);
    pdfUrl.value = ""; // 清空URL
  } finally {
    compiling.value = false;
  }
};
// 下载PDF
const downloadPdf = () => {
  if (!pdfId.value) {
    ElMessage.warning("请先编译TeX代码");
    return;
  }

  // 创建一个隐藏的a标签进行下载
  const downloadUrl = api.getPdfDownloadUrl(pdfId.value);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 组件挂载时初始化
onMounted(() => {
  // 可以在这里加载示例代码或默认模板
});
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.header {
  padding: 10px 20px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #dcdfe6;
  z-index: 10;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.editor-section,
.preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative; /* 为绝对定位子元素做准备 */
  overflow: hidden;
}

.editor-section {
  border-right: 1px solid #dcdfe6;
}

/* 关键修改：固定标题区域在每个部分的顶部 */
.section-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: white;
  z-index: 5;
  border-bottom: 1px solid #eaeaea;
  height: 40px; /* 明确高度 */
}

/* 为编辑器和预览区添加上边距，避免被标题覆盖 */
.editor-container,
.preview-container {
  margin-top: 60px; /* 比section-header的高度多一点 */
  height: calc(100% - 60px); /* 减去上边距 */
  width: 100%;
  overflow: auto;
}

.no-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
}
</style>
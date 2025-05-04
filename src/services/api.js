import axios from 'axios';

// API基础URL
const API_BASE_URL = 'http://localhost:5001/api';

// 创建axios实例
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

export default {
    /**
     * 编译TeX代码
     * @param {string} texCode - TeX源代码
     * @returns {Promise} - 包含编译结果的Promise
     */
    compileTeX(texCode) {
        return apiClient.post('/compile', { tex_code: texCode });
    },

    /**
     * 获取PDF预览URL
     * @param {string} pdfId - PDF文件ID
     * @returns {string} - PDF预览URL
     */
    getPdfPreviewUrl(pdfId) {
        return `${API_BASE_URL}/preview/${pdfId}`;
    },

    /**
     * 获取PDF下载URL
     * @param {string} pdfId - PDF文件ID
     * @returns {string} - PDF下载URL
     */
    getPdfDownloadUrl(pdfId) {
        return `${API_BASE_URL}/download/${pdfId}`;
    }
};
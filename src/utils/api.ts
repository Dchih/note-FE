// API 基础地址
const API_BASE_URL = "http://dragonballchih.top/api";

// 获取 token
const getToken = () => {
  return localStorage.getItem("token");
};

// 通用请求函数
const request = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // 如果有 token，添加到请求头
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "请求失败");
  }

  return data;
};

// 笔记接口
export const notesApi = {
  // 获取笔记列表
  getList: async () => {
    return request("/notes");
  },

  // 获取单个笔记
  getById: async (id: number) => {
    return request(`/notes/${id}`);
  },

  // 创建笔记
  create: async (data: { title: string; content: string }) => {
    return request("/notes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // 更新笔记
  update: async (id: number, data: { title: string; content: string }) => {
    return request(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // 删除笔记
  delete: async (id: number) => {
    return request(`/notes/${id}`, {
      method: "DELETE",
    });
  },
};

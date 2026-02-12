// API 基础地址
// 开发环境使用代理，生产环境使用完整 URL
const API_BASE_URL = import.meta.env.DEV
  ? "/api"  // 开发环境通过 Vite 代理
  : "https://dragonballchih.top/api";  // 生产环境使用 HTTPS

// 获取 token
const getToken = () => {
  return localStorage.getItem("token");
};

// 通用请求函数
export const request = async (url: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const payload = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, payload);

  const data = payload.method === "DELETE" ? {code: 204, msg: "ok"} : await response.json();

  if (!response.ok) {
    throw new Error(data.message || "请求失败");
  }

  return data;
};

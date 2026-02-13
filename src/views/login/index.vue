<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { request } from "../../utils/api";
import MountainBackground from "../../components/MountainBackground.vue";

const router = useRouter();

const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

// 登录处理函数
const handleLogin = async () => {
  // 清空错误信息
  errorMessage.value = "";

  // 验证输入
  if (!username.value.trim()) {
    errorMessage.value = "请输入用户名";
    return;
  }

  if (!password.value.trim()) {
    errorMessage.value = "请输入密码";
    return;
  }

  loading.value = true;

  try {
    const data = await request("/login", {
      method: "POST",
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    // 保存 token 和用户信息
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    // 存储用户名（后端返回 data 字段为用户对象）
    const user = data.data || data.user;
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("username", user.username || username.value);
    } else {
      localStorage.setItem("username", username.value);
    }

    // 登录成功后跳转到聊天页
    router.push("/chat");
  } catch (error: any) {
    errorMessage.value = error.message || "登录失败，请检查用户名和密码";
    console.error("登录错误:", error);
  } finally {
    loading.value = false;
  }
};

// 跳转到注册页
const goToRegister = () => {
  router.push("/register");
};

// 按下回车键登录
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    handleLogin();
  }
};
</script>

<template>
  <div class="login-container">
    <!-- 山脉 Shader 背景 -->
    <MountainBackground />

    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">欢迎回来</h1>
        <p class="login-subtitle">登录到您的笔记应用</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <!-- 用户名输入 -->
        <div class="form-group">
          <label for="username" class="form-label">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
            @keypress="handleKeyPress"
            :disabled="loading"
          />
        </div>

        <!-- 密码输入 -->
        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            @keypress="handleKeyPress"
            :disabled="loading"
          />
        </div>

        <!-- 错误消息 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- 记住密码和忘记密码 -->
        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" />
            <span>记住我</span>
          </label>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>

        <!-- 登录按钮 -->
        <button type="submit" class="login-button" :disabled="loading">
          <span v-if="!loading">登录</span>
          <span v-else class="loading-spinner">
            <span class="spinner"></span>
            登录中...
          </span>
        </button>

        <!-- 注册链接 -->
        <div class="register-link">
          还没有账号？<a @click.prevent="goToRegister" href="#">立即注册</a>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #1a1510;
}

/* 登录卡片 */
.login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  z-index: 1;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 头部 */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  margin: 0 0 8px 0;
  font-size: 32px;
  line-height: 40px;
  font-weight: 700;
  background: linear-gradient(135deg, #f0c27f 0%, #fc5c7d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

/* 表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: rgba(240, 194, 127, 0.6);
  box-shadow: 0 0 0 4px rgba(240, 194, 127, 0.1);
  background: rgba(255, 255, 255, 0.12);
}

.form-input:disabled {
  background: rgba(255, 255, 255, 0.04);
  cursor: not-allowed;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

/* 错误消息 */
.error-message {
  padding: 12px 16px;
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.3);
  border-radius: 8px;
  color: #ff8a8a;
  font-size: 14px;
  text-align: center;
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
}

.remember-me input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.forgot-password {
  color: #f0c27f;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #fc5c7d;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #f0c27f 0%, #fc5c7d 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(240, 194, 127, 0.3);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 194, 127, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 注册链接 */
.register-link {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.register-link a {
  color: #f0c27f;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: color 0.3s ease;
  cursor: pointer;
}

.register-link a:hover {
  color: #fc5c7d;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .login-card {
    margin: 20px;
    padding: 32px 24px;
  }

  .login-title {
    font-size: 28px;
  }

  .login-subtitle {
    font-size: 14px;
  }
}
</style>

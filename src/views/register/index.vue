<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { request } from "../../utils/api";
import MountainBackground from "../../components/MountainBackground.vue";

const router = useRouter();

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMessage = ref("");
const agreeTerms = ref(false);

// 邮箱验证正则
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 注册处理函数
const handleRegister = async () => {
  // 清空错误信息
  errorMessage.value = "";

  // 验证输入
  if (!username.value.trim()) {
    errorMessage.value = "请输入用户名";
    return;
  }

  if (username.value.trim().length < 3) {
    errorMessage.value = "用户名至少需要 3 个字符";
    return;
  }

  if (!email.value.trim()) {
    errorMessage.value = "请输入邮箱";
    return;
  }

  if (!emailRegex.test(email.value)) {
    errorMessage.value = "请输入有效的邮箱地址";
    return;
  }

  if (!password.value) {
    errorMessage.value = "请输入密码";
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = "密码至少需要 6 个字符";
    return;
  }

  if (!confirmPassword.value) {
    errorMessage.value = "请确认密码";
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "两次输入的密码不一致";
    return;
  }

  if (!agreeTerms.value) {
    errorMessage.value = "请阅读并同意服务条款";
    return;
  }

  loading.value = true;

  try {
    await request("/register", {
      method: "POST",
      body: JSON.stringify({
        username: username.value,
        password: password.value,
        email: email.value,
      }),
    });

    // 注册成功后跳转到登录页
    router.push("/login");
  } catch (error: any) {
    errorMessage.value = error.message || "注册失败，请稍后重试";
    console.error("注册错误:", error);
  } finally {
    loading.value = false;
  }
};

// 跳转到登录页
const goToLogin = () => {
  router.push("/login");
};

// 按下回车键注册
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    handleRegister();
  }
};
</script>

<template>
  <div class="register-container">
    <!-- 山脉 Shader 背景 -->
    <MountainBackground />

    <!-- 注册卡片 -->
    <div class="register-card">
      <div class="register-header">
        <h1 class="register-title">创建账号</h1>
        <p class="register-subtitle">开始您的笔记之旅</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <!-- 用户名输入 -->
        <div class="form-group">
          <label for="username" class="form-label">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="form-input"
            placeholder="至少 3 个字符"
            @keypress="handleKeyPress"
            :disabled="loading"
          />
        </div>

        <!-- 邮箱输入 -->
        <div class="form-group">
          <label for="email" class="form-label">邮箱</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="your@email.com"
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
            placeholder="至少 6 个字符"
            @keypress="handleKeyPress"
            :disabled="loading"
          />
        </div>

        <!-- 确认密码输入 -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">确认密码</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="form-input"
            placeholder="再次输入密码"
            @keypress="handleKeyPress"
            :disabled="loading"
          />
        </div>

        <!-- 错误消息 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- 同意条款 -->
        <div class="form-terms">
          <label class="terms-checkbox">
            <input type="checkbox" v-model="agreeTerms" />
            <span
              >我已阅读并同意<a href="#" class="terms-link">服务条款</a>和<a
                href="#"
                class="terms-link"
                >隐私政策</a
              ></span
            >
          </label>
        </div>

        <!-- 注册按钮 -->
        <button type="submit" class="register-button" :disabled="loading">
          <span v-if="!loading">注册</span>
          <span v-else class="loading-spinner">
            <span class="spinner"></span>
            注册中...
          </span>
        </button>

        <!-- 登录链接 -->
        <div class="login-link">
          已有账号？<a @click.prevent="goToLogin" href="#">立即登录</a>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #1a1510;
}

/* 注册卡片 */
.register-card {
  position: relative;
  width: 100%;
  max-width: 460px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  z-index: 1;
  animation: slideUp 0.6s ease-out;
  max-height: 90vh;
  overflow-y: auto;
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
.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-title {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #f0c27f 0%, #fc5c7d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.register-subtitle {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

/* 表单 */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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

/* 服务条款 */
.form-terms {
  margin-top: 4px;
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.6;
}

.terms-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
  flex-shrink: 0;
}

.terms-link {
  color: #f0c27f;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.terms-link:hover {
  color: #fc5c7d;
  text-decoration: underline;
}

/* 注册按钮 */
.register-button {
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
  margin-top: 8px;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 194, 127, 0.4);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

.register-button:disabled {
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

/* 登录链接 */
.login-link {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.login-link a {
  color: #f0c27f;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: color 0.3s ease;
  cursor: pointer;
}

.login-link a:hover {
  color: #fc5c7d;
}

/* 自定义滚动条 */
.register-card::-webkit-scrollbar {
  width: 6px;
}

.register-card::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.register-card::-webkit-scrollbar-thumb {
  background: rgba(240, 194, 127, 0.3);
  border-radius: 10px;
}

.register-card::-webkit-scrollbar-thumb:hover {
  background: rgba(240, 194, 127, 0.5);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .register-card {
    margin: 20px;
    padding: 32px 24px;
    max-height: calc(100vh - 40px);
  }

  .register-title {
    font-size: 28px;
  }

  .register-subtitle {
    font-size: 14px;
  }

  .register-form {
    gap: 16px;
  }
}
</style>

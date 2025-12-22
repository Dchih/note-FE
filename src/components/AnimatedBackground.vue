<script setup lang="ts">
// 动态渐变背景组件
</script>

<template>
  <div class="animated-background">
    <div class="gradient-bg"></div>
    <div class="gradient-sphere gradient-1"></div>
    <div class="gradient-sphere gradient-2"></div>
    <div class="gradient-sphere gradient-3"></div>
    <div class="gradient-sphere gradient-4"></div>
    <!-- 磨砂遮罩层 -->
    <div class="frosted-overlay"></div>
  </div>
</template>

<style scoped>
.animated-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    -45deg,
    #a5b4fc,
    #c4b5fd,
    #f9a8d4,
    #7dd3fc,
    #c7d2fe,
    #ddd6fe
  );
  background-size: 300% 300%;
  animation: gradientShift 20s ease infinite;
}

/* 磨砂遮罩层 */
.frosted-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(50px) saturate(130%);
  -webkit-backdrop-filter: blur(50px) saturate(130%);
  pointer-events: none;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 50% 100%;
  }
  50% {
    background-position: 100% 50%;
  }
  75% {
    background-position: 50% 0%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.gradient-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  mix-blend-mode: overlay;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.gradient-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #c7d2fe 0%, transparent 70%);
  top: -100px;
  left: -100px;
  animation: float1 10s infinite;
}

.gradient-2 {
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, #ddd6fe 0%, transparent 70%);
  top: 40%;
  right: -150px;
  animation: float2 12s infinite;
}

.gradient-3 {
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, #fce7f3 0%, transparent 70%);
  bottom: -100px;
  left: 20%;
  animation: float3 11s infinite;
}

.gradient-4 {
  width: 650px;
  height: 650px;
  background: radial-gradient(circle, #dbeafe 0%, transparent 70%);
  top: 30%;
  left: 50%;
  animation: float4 14s infinite;
}

@keyframes float1 {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(200px, 100px) scale(1.3);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

@keyframes float2 {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-150px, 150px) scale(1.4);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

@keyframes float3 {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-200px, -100px) scale(1.2);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

@keyframes float4 {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(150px, -100px) scale(1.3) rotate(180deg);
  }
  100% {
    transform: translate(0, 0) scale(1) rotate(360deg);
  }
}

/* 响应式：移动端减小光球尺寸 */
@media (max-width: 768px) {
  .gradient-sphere {
    filter: blur(60px);
  }

  .gradient-1 {
    width: 300px;
    height: 300px;
  }

  .gradient-2 {
    width: 350px;
    height: 350px;
  }

  .gradient-3 {
    width: 280px;
    height: 280px;
  }

  .gradient-4 {
    width: 320px;
    height: 320px;
  }
}
</style>

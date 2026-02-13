<script setup lang="ts">
import { ref } from 'vue'
import { useMountainShader } from '../composables/useMountainShader'

const canvasRef = ref<HTMLCanvasElement | null>(null)
useMountainShader(canvasRef)
</script>

<template>
  <canvas ref="canvasRef" class="mountain-bg" />
</template>

<style scoped>
.mountain-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>

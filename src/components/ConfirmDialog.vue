<script setup lang="ts">
interface Props {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  discardText?: string;
  showDiscard?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: "确认",
  confirmText: "保存",
  cancelText: "取消",
  discardText: "放弃",
  showDiscard: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  discard: [];
}>();

const handleConfirm = () => {
  emit("confirm");
};

const handleDiscard = () => {
  emit("discard");
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<template>
  <div class="dialog-overlay" @click.self="handleCancel">
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>{{ title }}</h3>
      </div>
      <div class="dialog-body">
        <p>{{ message }}</p>
      </div>
      <div class="dialog-footer">
        <button @click="handleCancel" class="btn btn-cancel">
          {{ cancelText }}
        </button>
        <button
          v-if="showDiscard"
          @click="handleDiscard"
          class="btn btn-discard"
        >
          {{ discardText }}
        </button>
        <button @click="handleConfirm" class="btn btn-confirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  min-width: 400px;
  max-width: 90%;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.dialog-body {
  padding: 24px;
}

.dialog-body p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
}

.dialog-footer {
  padding: 16px 24px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-discard {
  background: #ff6b6b;
  color: white;
}

.btn-discard:hover {
  background: #ff5252;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .dialog-content {
    min-width: auto;
    width: 90%;
  }

  .dialog-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>

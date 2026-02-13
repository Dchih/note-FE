<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getConversations, createConversation } from '../../utils/chatApi'
import { useWebSocket } from '../../composables/useWebSocket'

const router = useRouter()

// 当前用户名
const currentUsername = ref(localStorage.getItem('username') || '未知用户')

// 会话相关
interface Conversation {
  id: number
  name: string
  [key: string]: any
}

const conversations = ref<Conversation[]>([])
const activeConversationId = ref<number | null>(null)
const showCreateDialog = ref(false)
const newConversationName = ref('')
const newMemberIds = ref('')

// WebSocket
const { messages, connected, disconnect, connect, joinConversation, sendMessage } = useWebSocket()

// 消息输入
const inputMessage = ref('')
const messageListRef = ref<HTMLElement | null>(null)

// 自动滚到底部
function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

watch(messages, () => scrollToBottom(), { deep: true })

// 加载会话列表
async function loadConversations() {
  try {
    const data = await getConversations()
    conversations.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    console.error('加载会话失败:', e)
  }
}

// 选择会话
function selectConversation(conv: Conversation) {
  activeConversationId.value = conv.id
  joinConversation(conv.id)
}

// 发送消息
function handleSend() {
  const msg = inputMessage.value.trim()
  if (!msg || !activeConversationId.value) return
  sendMessage(activeConversationId.value, msg)
  inputMessage.value = ''
}

// 按回车发送
function handleKeyPress(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 创建新会话
async function handleCreateConversation() {
  const name = newConversationName.value.trim()
  if (!name) return

  const memberIds = newMemberIds.value
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))

  try {
    await createConversation(name, memberIds)
    showCreateDialog.value = false
    newConversationName.value = ''
    newMemberIds.value = ''
    await loadConversations()
  } catch (e: any) {
    console.error('创建会话失败:', e)
  }
}

// 退出登录
function handleLogout() {
  disconnect()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('username')
  router.push('/login')
}

onMounted(() => {
  connect()
  loadConversations()
})
</script>

<template>
  <div class="chat-container">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">{{ currentUsername }}</h2>
        <button class="btn-new" @click="showCreateDialog = true">+</button>
      </div>

      <div class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          :class="{ active: activeConversationId === conv.id }"
          @click="selectConversation(conv)"
        >
          <span class="conversation-name">{{ conv.name || `会话 #${conv.id}` }}</span>
        </div>
        <div v-if="conversations.length === 0" class="empty-hint">
          暂无会话，点击 + 创建
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="connection-status">
          <span class="status-dot" :class="{ online: connected }"></span>
          {{ connected ? '已连接' : '未连接' }}
        </div>
        <button class="btn-logout" @click="handleLogout">退出</button>
      </div>
    </aside>

    <!-- 右侧消息区 -->
    <main class="chat-main">
      <template v-if="activeConversationId">
        <div class="chat-header">
          <h3>
            {{
              conversations.find((c) => c.id === activeConversationId)?.name ||
              `会话 #${activeConversationId}`
            }}
          </h3>
        </div>

        <div ref="messageListRef" class="message-list">
          <div v-for="(msg, idx) in messages" :key="idx" class="message-item">
            {{ msg.msg }}
          </div>
          <div v-if="messages.length === 0" class="empty-hint">
            暂无消息，发送第一条吧
          </div>
        </div>

        <div class="chat-input">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="输入消息..."
            @keypress="handleKeyPress"
          />
          <button class="btn-send" @click="handleSend" :disabled="!inputMessage.trim()">
            发送
          </button>
        </div>
      </template>

      <template v-else>
        <div class="no-conversation">
          <p>选择一个会话开始聊天</p>
        </div>
      </template>
    </main>

    <!-- 创建会话弹窗 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog">
        <h3 class="dialog-title">创建新会话</h3>
        <div class="dialog-body">
          <label class="dialog-label">会话名称</label>
          <input
            v-model="newConversationName"
            type="text"
            class="dialog-input"
            placeholder="输入会话名称"
          />
          <label class="dialog-label">成员 ID（逗号分隔）</label>
          <input
            v-model="newMemberIds"
            type="text"
            class="dialog-input"
            placeholder="如: 2, 3, 5"
          />
        </div>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="showCreateDialog = false">取消</button>
          <button class="btn-confirm" @click="handleCreateConversation">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  background: #0f0f0f;
  color: #e0e0e0;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  background: #1a1a1a;
  border-right: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #2a2a2a;
}

.sidebar-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #f0c27f;
}

.btn-new {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(240, 194, 127, 0.15);
  color: #f0c27f;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-new:hover {
  background: rgba(240, 194, 127, 0.25);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 2px;
}

.conversation-item:hover {
  background: #252525;
}

.conversation-item.active {
  background: rgba(240, 194, 127, 0.12);
}

.conversation-name {
  font-size: 14px;
  color: #d0d0d0;
}

.conversation-item.active .conversation-name {
  color: #f0c27f;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

.status-dot.online {
  background: #4caf50;
}

.btn-logout {
  background: none;
  border: 1px solid #444;
  color: #999;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-logout:hover {
  border-color: #fc5c7d;
  color: #fc5c7d;
}

/* 主聊天区 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid #2a2a2a;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-item {
  padding: 10px 14px;
  background: #1a1a1a;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: #d0d0d0;
  max-width: 80%;
  word-break: break-word;
}

.chat-input {
  padding: 16px 24px;
  border-top: 1px solid #2a2a2a;
  display: flex;
  gap: 12px;
}

.chat-input input {
  flex: 1;
  padding: 12px 16px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 10px;
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input input:focus {
  border-color: rgba(240, 194, 127, 0.5);
}

.chat-input input::placeholder {
  color: #666;
}

.btn-send {
  padding: 12px 24px;
  background: linear-gradient(135deg, #f0c27f, #fc5c7d);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-send:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-conversation {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-conversation p {
  color: #666;
  font-size: 16px;
}

.empty-hint {
  text-align: center;
  color: #555;
  font-size: 13px;
  padding: 20px;
}

/* 弹窗 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  width: 400px;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 28px;
}

.dialog-title {
  margin: 0 0 20px;
  font-size: 18px;
  color: #f0c27f;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.dialog-label {
  font-size: 13px;
  color: #aaa;
  font-weight: 600;
}

.dialog-input {
  padding: 12px 14px;
  background: #151515;
  border: 1px solid #333;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
}

.dialog-input:focus {
  border-color: rgba(240, 194, 127, 0.5);
}

.dialog-input::placeholder {
  color: #555;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 10px 20px;
  background: none;
  border: 1px solid #444;
  border-radius: 8px;
  color: #999;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel:hover {
  border-color: #666;
  color: #ccc;
}

.btn-confirm {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f0c27f, #fc5c7d);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
}

.btn-confirm:hover {
  opacity: 0.9;
}

/* 滚动条 */
.conversation-list::-webkit-scrollbar,
.message-list::-webkit-scrollbar {
  width: 5px;
}

.conversation-list::-webkit-scrollbar-track,
.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-list::-webkit-scrollbar-thumb,
.message-list::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 10px;
}
</style>

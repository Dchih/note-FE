<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getConversations,
  createConversation,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
  searchUsers,
  getUserById,
} from '../../utils/chatApi'
import { useWebSocket } from '../../composables/useWebSocket'

const router = useRouter()

const currentUsername = ref(localStorage.getItem('username') || '未知用户')

interface User {
  id: number
  username: string
  email?: string
}

interface Conversation {
  id: number
  name: string
  [key: string]: any
}

interface FriendRequest {
  id: number
  requester_id: number
  receiver_id: number
  status: string
  created_at: string
  requester?: User
}

// 侧边栏标签
const activeTab = ref<'messages' | 'friends'>('messages')

// 会话相关
const conversations = ref<Conversation[]>([])
const activeConversationId = ref<number | null>(null)

// WebSocket
const { messages, connected, disconnect, connect, joinConversation, sendMessage } = useWebSocket()

// 消息输入
const inputMessage = ref('')
const messageListRef = ref<HTMLElement | null>(null)

// 好友相关
const friends = ref<User[]>([])
const pendingRequests = ref<FriendRequest[]>([])
const searchQuery = ref('')
const searchResults = ref<User[]>([])
const searchLoading = ref(false)
const addMsgMap = ref<Record<number, { text: string; ok: boolean }>>({})

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

watch(messages, () => scrollToBottom(), { deep: true })

async function loadConversations() {
  try {
    const data = await getConversations()
    conversations.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('加载会话失败:', e)
  }
}

async function loadFriends() {
  try {
    const data = await getFriends()
    friends.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('加载好友失败:', e)
  }
}

async function loadPendingRequests() {
  try {
    const data = await getPendingRequests()
    const list: FriendRequest[] = Array.isArray(data) ? data : []
    // 并行拉取每个申请人信息
    const enriched = await Promise.all(
      list.map(async (req) => {
        try {
          const user = await getUserById(req.requester_id)
          return { ...req, requester: user }
        } catch {
          return req
        }
      }),
    )
    pendingRequests.value = enriched
  } catch (e) {
    console.error('加载好友请求失败:', e)
  }
}

async function handleSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  searchLoading.value = true
  try {
    const data = await searchUsers(q)
    searchResults.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('搜索失败:', e)
  } finally {
    searchLoading.value = false
  }
}

async function handleSendRequest(user: User) {
  addMsgMap.value[user.id] = { text: '', ok: true }
  try {
    await sendFriendRequest(user.id)
    addMsgMap.value[user.id] = { text: '已发送', ok: true }
  } catch (e: any) {
    addMsgMap.value[user.id] = { text: e.message || '发送失败', ok: false }
  }
}

async function handleAccept(req: FriendRequest) {
  try {
    await acceptFriendRequest(req.id)
    await Promise.all([loadPendingRequests(), loadFriends()])
  } catch (e) {
    console.error('接受失败:', e)
  }
}

async function handleReject(req: FriendRequest) {
  try {
    await rejectFriendRequest(req.id)
    await loadPendingRequests()
  } catch (e) {
    console.error('拒绝失败:', e)
  }
}

// 发起私聊：创建或复用已有会话
async function startPrivateChat(friend: User) {
  try {
    const conv = await createConversation(friend.username, [friend.id])
    await loadConversations()
    activeConversationId.value = conv.id ?? conv.data?.id
    joinConversation(activeConversationId.value!)
    activeTab.value = 'messages'
  } catch (e) {
    console.error('创建会话失败:', e)
  }
}

function selectConversation(conv: Conversation) {
  activeConversationId.value = conv.id
  joinConversation(conv.id)
}

function handleSend() {
  const msg = inputMessage.value.trim()
  if (!msg || !activeConversationId.value) return
  sendMessage(activeConversationId.value, msg)
  inputMessage.value = ''
}

function handleKeyPress(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function switchTab(tab: 'messages' | 'friends') {
  activeTab.value = tab
  if (tab === 'friends') {
    loadFriends()
    loadPendingRequests()
  }
}

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
  loadPendingRequests()
})
</script>

<template>
  <div class="chat-container">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">{{ currentUsername }}</h2>
      </div>

      <!-- 标签切换 -->
      <div class="sidebar-tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'messages' }" @click="switchTab('messages')">
          消息
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'friends' }" @click="switchTab('friends')">
          好友
          <span v-if="pendingRequests.length > 0" class="badge">{{ pendingRequests.length }}</span>
        </button>
      </div>

      <!-- 消息列表 -->
      <div v-if="activeTab === 'messages'" class="list-panel">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conv-item"
          :class="{ active: activeConversationId === conv.id }"
          @click="selectConversation(conv)"
        >
          <div class="conv-avatar">{{ (conv.name || '#')[0].toUpperCase() }}</div>
          <span class="conv-name">{{ conv.name || `会话 #${conv.id}` }}</span>
        </div>
        <div v-if="conversations.length === 0" class="empty-hint">暂无会话</div>
      </div>

      <!-- 好友面板 -->
      <div v-if="activeTab === 'friends'" class="list-panel">
        <!-- 搜索用户 -->
        <div class="section">
          <p class="section-label">搜索用户</p>
          <div class="search-row">
            <input
              v-model="searchQuery"
              class="text-input"
              placeholder="输入用户名"
              @keypress.enter="handleSearch"
            />
            <button class="btn-icon" :disabled="searchLoading" @click="handleSearch">
              {{ searchLoading ? '…' : '搜' }}
            </button>
          </div>
          <div v-if="searchResults.length > 0" class="result-list">
            <div v-for="u in searchResults" :key="u.id" class="user-item">
              <div class="user-info">
                <span class="user-name">{{ u.username }}</span>
                <span class="user-id">#{{ u.id }}</span>
              </div>
              <div class="user-action">
                <span v-if="addMsgMap[u.id]" class="add-msg" :class="{ error: !addMsgMap[u.id].ok }">
                  {{ addMsgMap[u.id].text }}
                </span>
                <button v-else class="btn-small btn-primary" @click="handleSendRequest(u)">添加</button>
              </div>
            </div>
          </div>
          <div v-else-if="searchQuery && !searchLoading" class="empty-hint">无结果</div>
        </div>

        <!-- 我的好友 -->
        <div class="section">
          <p class="section-label">我的好友（{{ friends.length }}）</p>
          <div v-if="friends.length === 0" class="empty-hint">暂无好友</div>
          <div v-for="f in friends" :key="f.id" class="user-item">
            <div class="user-info">
              <div class="friend-avatar">{{ f.username[0].toUpperCase() }}</div>
              <span class="user-name">{{ f.username }}</span>
            </div>
            <button class="btn-small btn-chat" @click="startPrivateChat(f)">私聊</button>
          </div>
        </div>

        <!-- 好友申请 -->
        <div class="section">
          <p class="section-label">收到的申请（{{ pendingRequests.length }}）</p>
          <div v-if="pendingRequests.length === 0" class="empty-hint">暂无申请</div>
          <div v-for="req in pendingRequests" :key="req.id" class="user-item">
            <div class="user-info">
              <div class="friend-avatar req">{{ (req.requester?.username || '?')[0].toUpperCase() }}</div>
              <div>
                <span class="user-name">{{ req.requester?.username || `用户 #${req.requester_id}` }}</span>
              </div>
            </div>
            <div class="request-btns">
              <button class="btn-small btn-accept" @click="handleAccept(req)">接受</button>
              <button class="btn-small btn-reject" @click="handleReject(req)">拒绝</button>
            </div>
          </div>
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
            {{ conversations.find((c) => c.id === activeConversationId)?.name || `会话 #${activeConversationId}` }}
          </h3>
        </div>

        <div ref="messageListRef" class="message-list">
          <div v-for="(msg, idx) in messages" :key="idx" class="message-item">
            {{ msg.msg }}
          </div>
          <div v-if="messages.length === 0" class="empty-hint center">暂无消息，发送第一条吧</div>
        </div>

        <div class="chat-input">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="输入消息..."
            @keypress="handleKeyPress"
          />
          <button class="btn-send" @click="handleSend" :disabled="!inputMessage.trim()">发送</button>
        </div>
      </template>

      <template v-else>
        <div class="no-conversation">
          <p>从好友列表发起私聊，或选择已有会话</p>
        </div>
      </template>
    </main>
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
  padding: 20px;
  border-bottom: 1px solid #2a2a2a;
}

.sidebar-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #f0c27f;
}

/* 标签栏 */
.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 10px 0;
  background: none;
  border: none;
  color: #777;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
  position: relative;
}

.tab-btn:hover { color: #bbb; }

.tab-btn.active {
  color: #f0c27f;
  box-shadow: inset 0 -2px 0 #f0c27f;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #fc5c7d;
  border-radius: 50%;
  font-size: 10px;
  color: white;
  margin-left: 4px;
  font-weight: 700;
}

/* 列表面板 */
.list-panel {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* 会话项 */
.conv-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 10px;
  margin: 0 8px 2px;
  cursor: pointer;
  transition: background 0.2s;
}

.conv-item:hover { background: #252525; }
.conv-item.active { background: rgba(240, 194, 127, 0.12); }
.conv-item.active .conv-name { color: #f0c27f; }

.conv-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #888;
  flex-shrink: 0;
}

.conv-name {
  font-size: 14px;
  color: #d0d0d0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 好友面板分区 */
.section {
  padding: 12px 16px;
  border-bottom: 1px solid #222;
}

.section:last-child { border-bottom: none; }

.section-label {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #555;
}

/* 搜索 */
.search-row {
  display: flex;
  gap: 6px;
}

.text-input {
  flex: 1;
  padding: 8px 10px;
  background: #151515;
  border: 1px solid #333;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
  min-width: 0;
}

.text-input:focus { border-color: rgba(240, 194, 127, 0.5); }
.text-input::placeholder { color: #555; }

.btn-icon {
  padding: 8px 12px;
  background: rgba(240, 194, 127, 0.1);
  border: 1px solid rgba(240, 194, 127, 0.25);
  border-radius: 8px;
  color: #f0c27f;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-icon:hover { background: rgba(240, 194, 127, 0.2); }
.btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }

/* 用户列表项 */
.result-list { margin-top: 8px; }

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #1e1e1e;
}

.user-item:last-child { border-bottom: none; }

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.friend-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #252525;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #f0c27f;
  flex-shrink: 0;
}

.friend-avatar.req { color: #fc5c7d; }

.user-name {
  font-size: 13px;
  color: #d0d0d0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.user-id {
  font-size: 11px;
  color: #555;
}

.user-action { display: flex; align-items: center; }

.add-msg {
  font-size: 11px;
  color: #4caf50;
}

.add-msg.error { color: #fc5c7d; }

/* 小按钮 */
.btn-small {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn-primary {
  background: rgba(240, 194, 127, 0.12);
  border-color: rgba(240, 194, 127, 0.3);
  color: #f0c27f;
}

.btn-primary:hover { background: rgba(240, 194, 127, 0.22); }

.btn-chat {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.3);
  color: #4caf50;
}

.btn-chat:hover { background: rgba(76, 175, 80, 0.2); }

.request-btns { display: flex; gap: 6px; }

.btn-accept {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.35);
  color: #4caf50;
}

.btn-accept:hover { background: rgba(76, 175, 80, 0.25); }

.btn-reject {
  background: rgba(252, 92, 125, 0.1);
  border-color: rgba(252, 92, 125, 0.35);
  color: #fc5c7d;
}

.btn-reject:hover { background: rgba(252, 92, 125, 0.25); }

/* 底部 */
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
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

.status-dot.online { background: #4caf50; }

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

/* 聊天区 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
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
  flex-shrink: 0;
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

.chat-input input:focus { border-color: rgba(240, 194, 127, 0.5); }
.chat-input input::placeholder { color: #666; }

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

.btn-send:hover:not(:disabled) { opacity: 0.9; }
.btn-send:disabled { opacity: 0.5; cursor: not-allowed; }

.no-conversation {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-conversation p { color: #666; font-size: 15px; }

.empty-hint {
  text-align: center;
  color: #555;
  font-size: 13px;
  padding: 16px;
}

.empty-hint.center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 滚动条 */
.list-panel::-webkit-scrollbar,
.message-list::-webkit-scrollbar {
  width: 4px;
}

.list-panel::-webkit-scrollbar-track,
.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.list-panel::-webkit-scrollbar-thumb,
.message-list::-webkit-scrollbar-thumb {
  background: #2a2a2a;
  border-radius: 10px;
}
</style>

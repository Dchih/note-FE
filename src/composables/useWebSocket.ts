import { ref, onBeforeUnmount } from 'vue'

export interface ChatMessage {
  msg: string
}

const WS_BASE_URL = import.meta.env.DEV
  ? `ws://localhost:1420/api/ws`
  : `wss://dragonballchih.top/api/ws`

export function useWebSocket() {
  const messages = ref<ChatMessage[]>([])
  const connected = ref(false)
  let ws: WebSocket | null = null

  function connect() {
    const token = localStorage.getItem('token')
    if (!token) return

    ws = new WebSocket(`${WS_BASE_URL}?token=${token}`)

    ws.onopen = () => {
      connected.value = true
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        messages.value.push(data)
      } catch {
        messages.value.push({ msg: event.data })
      }
    }

    ws.onclose = () => {
      connected.value = false
    }

    ws.onerror = () => {
      connected.value = false
    }
  }

  function joinConversation(conversationId: number) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    // 切换会话时清空消息（后端会推送最近20条）
    messages.value = []
    ws.send(JSON.stringify({ action: 'join', conversation_id: conversationId }))
  }

  function sendMessage(conversationId: number, msg: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ action: 'msg', conversation_id: conversationId, msg }))
  }

  function disconnect() {
    ws?.close()
    ws = null
    connected.value = false
  }

  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    messages,
    connected,
    connect,
    joinConversation,
    sendMessage,
    disconnect,
  }
}

import { request } from './api'

// 获取会话列表
export const getConversations = () => request('/conversations')

// 创建会话
export const createConversation = (name: string, memberIds: number[]) =>
  request('/conversations', {
    method: 'POST',
    body: JSON.stringify({ name, member_ids: memberIds }),
  })

// 添加会话成员
export const addMember = (conversationId: number, userId: number) =>
  request(`/conversations/${conversationId}/members`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })

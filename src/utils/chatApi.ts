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

// 发送好友请求
export const sendFriendRequest = (receiverId: number) =>
  request('/friendships', {
    method: 'POST',
    body: JSON.stringify({ receiver_id: receiverId }),
  })

// 接受好友请求
export const acceptFriendRequest = (id: number) =>
  request(`/friendships/${id}/accept`, { method: 'POST' })

// 拒绝好友请求
export const rejectFriendRequest = (id: number) =>
  request(`/friendships/${id}/reject`, { method: 'POST' })

// 获取待处理的好友请求（我收到的）
export const getPendingRequests = () => request('/friendships/pending')

// 获取好友列表（已接受）
export const getFriends = () => request('/friendships')

// 搜索用户
export const searchUsers = (q: string) =>
  request(`/users/search?q=${encodeURIComponent(q)}`)

// 按 ID 获取用户
export const getUserById = (id: number) => request(`/users/${id}`)

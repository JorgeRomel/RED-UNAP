import ApiService from './api';

export const commentsService = {
  async getStoryComments(storyId, params = {}) {
    const queryString = new URLSearchParams({
      sort: 'newest',
      page: 1,
      limit: 50,
      ...params
    }).toString();
    return await ApiService.get(`/comments/story/${storyId}?${queryString}`);
  },

  async createComment(storyId, content, parentCommentId = null) {
    return await ApiService.post(`/comments/story/${storyId}`, {
      content,
      parent_comment_id: parentCommentId
    });
  },

  async updateComment(commentId, content) {
    return await ApiService.put(`/comments/${commentId}`, { content });
  },

  async deleteComment(commentId) {
    return await ApiService.delete(`/comments/${commentId}`);
  },

  async getCommentReplies(commentId, params = {}) {
    const queryString = new URLSearchParams({
      sort: 'oldest',
      ...params
    }).toString();
    return await ApiService.get(`/comments/${commentId}/replies?${queryString}`);
  },

  async getComment(commentId) {
    return await ApiService.get(`/comments/${commentId}`);
  }
};
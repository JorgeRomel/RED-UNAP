import ApiService from './api';

export const reactionsService = {
  async reactToStory(storyId, reactionType) {
    return await ApiService.post(`/reactions/story/${storyId}`, {
      reaction_type: reactionType
    });
  },

  async getStoryReactions(storyId) {
    return await ApiService.get(`/reactions/story/${storyId}`);
  },

  async reactToComment(commentId, reactionType) {
    return await ApiService.post(`/reactions/comment/${commentId}`, {
      reaction_type: reactionType
    });
  },

  async getCommentReactions(commentId) {
    return await ApiService.get(`/reactions/comment/${commentId}`);
  },

  async removeStoryReaction(storyId) {
    return await ApiService.delete(`/reactions/story/${storyId}`);
  },

  async removeCommentReaction(commentId) {
    return await ApiService.delete(`/reactions/comment/${commentId}`);
  },

  async getStoryReactionStats(storyId) {
    return await ApiService.get(`/reactions/story/${storyId}/stats`);
  }
};
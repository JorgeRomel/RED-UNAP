import { useState, useEffect, useCallback } from 'react';
import { storiesService } from '../services/Stories';
import { commentsService } from '../services/comments';
import { reactionsService } from '../services/reactions';

export const useStoryDetail = (storyId) => {
  const [story, setStory] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userReaction, setUserReaction] = useState(null);

  const loadStory = useCallback(async () => {
    if (!storyId) return;

    setLoading(true);
    setError(null);

    try {
      const storyData = await storiesService.getStory(storyId);
      setStory(storyData.story || storyData);
      setUserReaction(storyData.story?.user_reaction || storyData.user_reaction);
    } catch (err) {
      setError(err.message || 'Error al cargar la historia');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  const loadComments = useCallback(async () => {
    if (!storyId) return;

    try {
      const commentsData = await commentsService.getStoryComments(storyId);
      setComments(commentsData.comments || commentsData);
    } catch (err) {
      console.error('Error loading comments:', err);
      setComments([]);
    }
  }, [storyId]);

  const reactToStory = useCallback(async (reactionType) => {
    if (!story) return;

    try {
      const currentReaction = userReaction;
      const newReaction = currentReaction === reactionType ? null : reactionType;
      
      setUserReaction(newReaction);
      setStory(prev => ({
        ...prev,
        likes_count: prev.likes_count + (
          newReaction === 'like' ? 1 : 
          currentReaction === 'like' ? -1 : 0
        ),
        dislikes_count: prev.dislikes_count + (
          newReaction === 'dislike' ? 1 : 
          currentReaction === 'dislike' ? -1 : 0
        ),
        user_reaction: newReaction
      }));

      if (newReaction) {
        await reactionsService.reactToStory(story.id, newReaction);
      } else {
        await reactionsService.removeStoryReaction(story.id);
      }

      return newReaction;
    } catch (err) {
      setUserReaction(userReaction);
      setStory(prev => ({
        ...prev,
        likes_count: story.likes_count,
        dislikes_count: story.dislikes_count,
        user_reaction: userReaction
      }));
      throw new Error(err.message || 'Error al reaccionar');
    }
  }, [story, userReaction]);

  const addComment = useCallback(async (content, parentCommentId = null) => {
    if (!story) return;

    try {
      const newCommentData = await commentsService.createComment(story.id, content, parentCommentId);
      const newComment = newCommentData.comment || newCommentData;

      if (parentCommentId) {
        setComments(prev => prev.map(comment => 
          comment.id === parentCommentId 
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), newComment] 
              }
            : comment
        ));
      } else {
        setComments(prev => [newComment, ...prev]);
      }

      setStory(prev => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1
      }));

      return newComment;
    } catch (err) {
      throw new Error(err.message || 'Error al agregar comentario');
    }
  }, [story]);

  const reactToComment = useCallback(async (commentId, reactionType) => {
    try {
      await reactionsService.reactToComment(commentId, reactionType);
      
      const updateCommentReaction = (comments) => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            const currentReaction = comment.user_reaction;
            const newReaction = currentReaction === reactionType ? null : reactionType;
            return {
              ...comment,
              likes_count: (comment.likes_count || 0) + (
                newReaction === 'like' ? 1 : 
                currentReaction === 'like' ? -1 : 0
              ),
              dislikes_count: (comment.dislikes_count || 0) + (
                newReaction === 'dislike' ? 1 : 
                currentReaction === 'dislike' ? -1 : 0
              ),
              user_reaction: newReaction
            };
          }
          
          if (comment.replies) {
            return {
              ...comment,
              replies: updateCommentReaction(comment.replies)
            };
          }
          
          return comment;
        });
      };

      setComments(prev => updateCommentReaction(prev));
    } catch (err) {
      throw new Error(err.message || 'Error al reaccionar al comentario');
    }
  }, []);

  useEffect(() => {
    if (storyId) {
      loadStory();
    }
  }, [storyId, loadStory]);

  useEffect(() => {
    if (story && storyId) {
      loadComments();
    }
  }, [story, storyId, loadComments]);

  return {
    story,
    comments,
    loading,
    error,
    userReaction,
    reactToStory,
    addComment,
    reactToComment,
    refreshStory: loadStory,
    refreshComments: loadComments
  };
};
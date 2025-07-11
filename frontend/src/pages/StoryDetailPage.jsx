import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStoryDetail } from '../hooks/useStoryDetail';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Eye,
  Share2,
  Clock,
  User,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Send,
  Reply,
  Flag,
  Bookmark,
  BookmarkCheck,
  RefreshCw
} from 'lucide-react';

const ReactionButton = ({ type, count, isActive, onClick, loading }) => {
  const Icon = type === 'like' ? ThumbsUp : ThumbsDown;
  const baseClasses = "flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all";
  const activeClasses = type === 'like' 
    ? "bg-green-50 border-green-300 text-green-700" 
    : "bg-red-50 border-red-300 text-red-700";
  const inactiveClasses = "border-gray-300 text-gray-600 hover:bg-gray-50";

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} disabled:opacity-50`}
    >
      <Icon size={18} className={isActive ? 'fill-current' : ''} />
      <span className="font-medium">{count}</span>
    </button>
  );
};

const CommentItem = ({ comment, onReply, onReaction, currentUser, level = 0 }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmittingReply(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        {/* Header del comentario */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {(comment.author || comment.username || 'A').charAt(0)}
            </div>
            <div>
              <span className="font-medium text-gray-900">
                {comment.author || comment.username}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                {formatDate(comment.created_at)}
              </span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Contenido del comentario */}
        <div className="mb-4">
          <p className="text-gray-800 leading-relaxed">{comment.content}</p>
        </div>

        {/* Acciones del comentario */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onReaction(comment.id, 'like')}
            className={`flex items-center space-x-1 text-sm transition-colors ${
              comment.user_reaction === 'like' 
                ? 'text-green-600' 
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            <ThumbsUp size={14} className={comment.user_reaction === 'like' ? 'fill-current' : ''} />
            <span>{comment.likes_count || 0}</span>
          </button>
          
          <button
            onClick={() => onReaction(comment.id, 'dislike')}
            className={`flex items-center space-x-1 text-sm transition-colors ${
              comment.user_reaction === 'dislike' 
                ? 'text-red-600' 
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            <ThumbsDown size={14} className={comment.user_reaction === 'dislike' ? 'fill-current' : ''} />
            <span>{comment.dislikes_count || 0}</span>
          </button>

          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Reply size={14} />
            <span>Responder</span>
          </button>

          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <Flag size={14} />
            <span>Reportar</span>
          </button>
        </div>

        {/* Formulario de respuesta */}
        {showReplyForm && (
          <form onSubmit={handleSubmitReply} className="mt-4 p-4 bg-gray-50 rounded-lg">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Escribe tu respuesta..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-end space-x-3 mt-3">
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!replyContent.trim() || isSubmittingReply}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
                <span>{isSubmittingReply ? 'Enviando...' : 'Responder'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Respuestas anidadas */}
      {comment.replies && comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onReply={onReply}
          onReaction={onReaction}
          currentUser={currentUser}
          level={level + 1}
        />
      ))}
    </div>
  );
};

const CommentForm = ({ onSubmit, loading }) => {
  const [content, setContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await onSubmit(content);
      setContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar comentario</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Comparte tu opinión sobre esta historia..."
        rows={4}
        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          {content.length}/500 caracteres
        </span>
        <button
          type="submit"
          disabled={!content.trim() || loading || content.length > 500}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} />
          <span>{loading ? 'Enviando...' : 'Comentar'}</span>
        </button>
      </div>
    </form>
  );
};

const StoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [relatedStories, setRelatedStories] = useState([]);

  const {
    story,
    comments,
    loading,
    error,
    userReaction,
    reactToStory,
    addComment,
    reactToComment,
    refreshStory
  } = useStoryDetail(id);

  useEffect(() => {
    const loadRelatedStories = async () => {
      if (!story) return;
      
      try {
        const { storiesService } = await import('../services/Stories');
        const response = await storiesService.getStories({
          category: story.category,
          limit: 4,
          exclude: story.id
        });
        setRelatedStories(response.stories?.slice(0, 2) || []);
      } catch (error) {
        console.error('Error loading related stories:', error);
      }
    };

    loadRelatedStories();
  }, [story]);

  useEffect(() => {
    if (story) {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      setIsBookmarked(bookmarks.includes(story.id));
    }
  }, [story]);

  const handleReaction = async (type) => {
    try {
      await reactToStory(type);
    } catch (error) {
      console.error('Error reacting to story:', error);
    }
  };

  const handleCommentSubmit = async (content) => {
    try {
      await addComment(content);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleCommentReply = async (commentId, content) => {
    try {
      await addComment(content, commentId);
    } catch (error) {
      console.error('Error replying to comment:', error);
    }
  };

  const handleCommentReaction = async (commentId, type) => {
    try {
      await reactToComment(commentId, type);
    } catch (error) {
      console.error('Error reacting to comment:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: story.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    if (isBookmarked) {
      const filtered = bookmarks.filter(bookmarkId => bookmarkId !== story.id);
      localStorage.setItem('bookmarks', JSON.stringify(filtered));
    } else {
      bookmarks.push(story.id);
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }
    setIsBookmarked(!isBookmarked);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-xl mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="text-red-600 mb-4">
          <MessageCircle size={64} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error al cargar la historia</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={refreshStory}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Intentar de nuevo</span>
            </button>
            <Link
              to="/stories"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ver todas las historias
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (!story) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Historia no encontrada</h2>
        <p className="text-gray-600 mb-6">La historia que buscas no existe o ha sido eliminada.</p>
        <Link
          to="/stories"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver todas las historias
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Navegación superior */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-lg border transition-colors ${
              isBookmarked 
                ? 'bg-yellow-50 border-yellow-300 text-yellow-700' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
          
          <button
            onClick={handleShare}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Artículo principal */}
      <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Imagen destacada */}
        {story.image_url && (
          <div className="h-96 relative overflow-hidden">
            <img
              src={story.image_url}
              alt={story.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                {story.category}
              </span>
            </div>
          </div>
        )}

        <div className="p-8">
          {/* Header del artículo */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
              {story.title}
            </h1>
            
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span>Por {story.author || story.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={16} />
                  <span>{formatDate(story.published_at)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye size={16} />
                  <span>{story.views_count || 0} vistas</span>
                </div>
                {story.reading_time && (
                  <span>⏱️ {story.reading_time} min de lectura</span>
                )}
              </div>
            </div>

            {story.summary && (
              <p className="text-xl text-gray-700 leading-relaxed font-light">
                {story.summary}
              </p>
            )}
          </div>

          {/* Contenido del artículo */}
          <div className="prose prose-lg max-w-none mb-8">
            {story.content && (
              <div 
                className="text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: story.content }}
              />
            )}
          </div>

          {/* Reacciones */}
          <div className="flex items-center justify-between py-6 border-t border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <ReactionButton
                type="like"
                count={story.likes_count || 0}
                isActive={userReaction === 'like'}
                onClick={() => handleReaction('like')}
                loading={false}
              />
              <ReactionButton
                type="dislike"
                count={story.dislikes_count || 0}
                isActive={userReaction === 'dislike'}
                onClick={() => handleReaction('dislike')}
                loading={false}
              />
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <MessageCircle size={16} />
                <span>{story.comments_count || 0} comentarios</span>
              </span>
              <span className="flex items-center space-x-1">
                <Eye size={16} />
                <span>{story.views_count || 0} vistas</span>
              </span>
            </div>
          </div>
        </div>
      </article>

      {/* Sección de comentarios */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Comentarios ({comments.length})
        </h2>

        {/* Formulario de nuevo comentario */}
        <CommentForm onSubmit={handleCommentSubmit} loading={false} />

        {/* Lista de comentarios */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleCommentReply}
              onReaction={handleCommentReaction}
              currentUser={user}
            />
          ))}
          
          {comments.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay comentarios aún
              </h3>
              <p className="text-gray-600">
                ¡Sé el primero en comentar esta historia!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historias relacionadas */}
      {relatedStories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Historias relacionadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedStories.map((relatedStory) => (
              <Link
                key={relatedStory.id}
                to={`/stories/${relatedStory.id}`}
                className="group block"
              >
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <span className="text-sm text-blue-600 font-medium">
                    {relatedStory.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mt-1 mb-2">
                    {relatedStory.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {relatedStory.summary}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{new Date(relatedStory.published_at).toLocaleDateString('es-ES')}</span>
                    <span>❤️ {relatedStory.likes_count || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryDetailPage;
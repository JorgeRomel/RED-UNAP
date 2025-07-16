import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [bio, setBio] = useState(user?.bio || '');
  const [editingBio, setEditingBio] = useState(false);
  const fileInputRef = useRef(null);

  // Estado para publicar historia
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [storyCategory, setStoryCategory] = useState('');
  const [storyImage, setStoryImage] = useState(null);
  const [stories, setStories] = useState([]);
  const [storyMessage, setStoryMessage] = useState('');

  if (!user) return <div className="p-8">No has iniciado sesión.</div>;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProfileImage(ev.target.result);
      reader.readAsDataURL(file);
      // Aquí deberías enviar la imagen al backend si quieres guardarla realmente
    }
  };

  const handleBioSave = () => {
    setEditingBio(false);
    // Aquí puedes enviar la biografía al backend si lo deseas
  };

  // Manejar imagen de la historia
  const handleStoryImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setStoryImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Publicar historia (simulado)
  const handlePublishStory = (e) => {
    e.preventDefault();
    if (!storyTitle || !storyContent) {
      setStoryMessage('El título y el contenido son obligatorios.');
      return;
    }
    const newStory = {
      id: Date.now(),
      title: storyTitle,
      content: storyContent,
      category: storyCategory,
      image: storyImage,
      author: user.username,
      date: new Date().toLocaleString(),
    };
    setStories([newStory, ...stories]);
    setStoryTitle('');
    setStoryContent('');
    setStoryCategory('');
    setStoryImage(null);
    setStoryMessage('¡Historia publicada!');
    setShowStoryForm(false);
    setTimeout(() => setStoryMessage(''), 3000);
    // Aquí deberías enviar la historia al backend
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-8 mt-8">
      <h1 className="text-3xl font-bold mb-4">Perfil de Usuario</h1>
      <div className="flex items-center space-x-6 mb-6">
        <div>
          <img
            src={profileImage || "https://ui-avatars.com/api/?name=" + user.username}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="block mt-2 text-blue-600 hover:underline text-sm"
          >
            Cambiar imagen
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
        <div>
          <p><strong>Usuario:</strong> {user.username}</p>
          <p><strong>Rol:</strong> {user.role}</p>
          <p><strong>Email:</strong> {user.email || 'No especificado'}</p>
          <p><strong>Miembro desde:</strong> {user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}</p>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Sobre mí</h2>
        {editingBio ? (
          <div>
            <textarea
              className="w-full border rounded-lg p-2 mb-2"
              rows={4}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Escribe tu biografía o comentario aquí..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleBioSave}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
              >
                Guardar
              </button>
              <button
                onClick={() => { setEditingBio(false); setBio(user?.bio || ''); }}
                className="bg-gray-200 px-4 py-1 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 min-h-[48px]">{bio || ""}</p>
            {bio && (
              <button
                onClick={() => setEditingBio(true)}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                Editar biografía
              </button>
            )}
          </div>
        )}
      </div>

      {/* Publicar historia/noticia */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Publicar historia o noticia</h2>
        {!showStoryForm && (
          <button
            onClick={() => setShowStoryForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
          >
            Nueva historia / noticia
          </button>
        )}
        {showStoryForm && (
          <form onSubmit={handlePublishStory} className="bg-gray-50 p-4 rounded-lg shadow mb-4">
            <div className="mb-2">
              <label className="block font-semibold mb-1">Título *</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2"
                value={storyTitle}
                onChange={e => setStoryTitle(e.target.value)}
                required
              />
            </div>
            <div className="mb-2">
              <label className="block font-semibold mb-1">Categoría</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2"
                value={storyCategory}
                onChange={e => setStoryCategory(e.target.value)}
                placeholder="Ej: Noticia, Experiencia, Evento..."
              />
            </div>
            <div className="mb-2">
              <label className="block font-semibold mb-1">Contenido *</label>
              <textarea
                className="w-full border rounded-lg p-2"
                rows={5}
                value={storyContent}
                onChange={e => setStoryContent(e.target.value)}
                required
                placeholder="Escribe la historia o noticia detallada aquí..."
              />
            </div>
            <div className="mb-2">
              <label className="block font-semibold mb-1">Imagen (opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleStoryImageChange}
              />
              {storyImage && (
                <img src={storyImage} alt="Previsualización" className="w-32 h-32 object-cover mt-2 rounded" />
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
              >
                Publicar
              </button>
              <button
                type="button"
                onClick={() => { setShowStoryForm(false); setStoryTitle(''); setStoryContent(''); setStoryCategory(''); setStoryImage(null); }}
                className="bg-gray-200 px-4 py-1 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
            {storyMessage && <div className="text-green-600 mt-2">{storyMessage}</div>}
          </form>
        )}

        {/* Lista de historias publicadas */}
        {stories.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Tus historias/noticias publicadas</h3>
            <ul className="space-y-4">
              {stories.map(story => (
                <li key={story.id} className="border rounded-lg p-4 bg-white shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{story.title}</span>
                    <span className="text-xs text-gray-500">{story.date}</span>
                  </div>
                  {story.category && (
                    <div className="text-xs text-blue-600 mb-1">Categoría: {story.category}</div>
                  )}
                  <div className="mb-2">{story.content}</div>
                  {story.image && (
                    <img src={story.image} alt="Historia" className="w-32 h-32 object-cover rounded" />
                  )}
                  <div className="text-xs text-gray-500 mt-2">Autor: {story.author}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
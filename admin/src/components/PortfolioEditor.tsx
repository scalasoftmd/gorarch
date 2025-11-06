import React, { useState, useEffect } from 'react';
import { ref as dbRef, set, remove, onValue, off } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { rtdb, storage } from '../firebase';
import AddProjectForm from './AddProjectForm';

type Language = 'ro' | 'ru' | 'de' | 'en';

interface MultilingualText {
  ro: string;
  ru: string;
  de: string;
  en: string;
}

interface ProjectSection {
  title: MultilingualText;
  description: MultilingualText;
  image: string;
  alignment: 'left' | 'right';
}

interface PortfolioItem {
  title: MultilingualText;
  client: string;
  scale: string;
  map: string;
  backgroundImage: string;
  sections: ProjectSection[];
  images: string[];
  tags: MultilingualText; // Ensure consistency with MultilingualText
}

interface DBItem extends PortfolioItem {
  id?: string;
}

const PortfolioEditor: React.FC = () => {
  const [items, setItems] = useState<DBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DBItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Initializing Firebase RTDB connection...');
    console.log('Database URL:', rtdb.app.options.databaseURL);
    
    // Check if database URL is configured
    if (!rtdb.app.options.databaseURL) {
      setConnectionError('Database URL not configured in Firebase config');
      setLoading(false);
      return;
    }
    
    loadItems();
    
    // Monitor connection status with better error handling
    const connectedRef = dbRef(rtdb, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      console.log('RTDB Connection status:', isConnected);
      setConnected(isConnected);
      
      if (isConnected) {
        setConnectionError(null);
      }
    }, (error) => {
      console.error('Connection monitoring error:', error);
      setConnectionError(error.message);
      setConnected(false);
    });
    
    // Cleanup listener on unmount
    return () => {
      const portfolioRef = dbRef(rtdb, 'portfolio');
      off(portfolioRef);
      off(connectedRef);
    };
  }, []);

  const loadItems = () => {
    console.log('Loading items from RTDB...');
    const portfolioRef = dbRef(rtdb, 'portfolio');
    
    onValue(portfolioRef, (snapshot) => {
      try {
        console.log('Received data from RTDB:', snapshot.val());
        const data = snapshot.val();
        if (data) {
          const itemsArray = Object.entries(data).map(([id, item]) => {
            const portfolioItem = item as any;
            
            // Ensure title is multilingual - convert old string titles to multilingual
            let title: MultilingualText;
            if (typeof portfolioItem.title === 'string') {
              title = {
                ro: portfolioItem.title,
                ru: portfolioItem.title,
                de: portfolioItem.title,
                en: portfolioItem.title
              };
            } else if (portfolioItem.title && typeof portfolioItem.title === 'object') {
              title = {
                ro: portfolioItem.title.ro || '',
                ru: portfolioItem.title.ru || '',
                de: portfolioItem.title.de || '',
                en: portfolioItem.title.en || ''
              };
            } else {
              title = { ro: '', ru: '', de: '', en: '' };
            }

            // Ensure sections have multilingual structure
            const sections = (portfolioItem.sections || []).map((section: any) => ({
              ...section,
              title: typeof section.title === 'string' 
                ? { ro: section.title, ru: section.title, de: section.title, en: section.title }
                : (section.title || { ro: '', ru: '', de: '', en: '' }),
              description: typeof section.description === 'string'
                ? { ro: section.description, ru: section.description, de: section.description, en: section.description }
                : (section.description || { ro: '', ru: '', de: '', en: '' })
            }));

            // Handle tags - ensure proper multilingual structure
            let tags: MultilingualText;
            if (Array.isArray(portfolioItem.tags)) {
              // Convert old array format to multilingual
              const tagsString = portfolioItem.tags.join(', ');
              tags = {
                ro: tagsString,
                ru: tagsString,
                de: tagsString,
                en: tagsString
              };
            } else if (portfolioItem.tags && typeof portfolioItem.tags === 'object') {
              tags = {
                ro: portfolioItem.tags.ro || '',
                ru: portfolioItem.tags.ru || '',
                de: portfolioItem.tags.de || '',
                en: portfolioItem.tags.en || ''
              };
            } else if (typeof portfolioItem.tags === 'string') {
              // Handle string tags
              tags = {
                ro: portfolioItem.tags,
                ru: portfolioItem.tags,
                de: portfolioItem.tags,
                en: portfolioItem.tags
              };
            } else {
              tags = { ro: '', ru: '', de: '', en: '' };
            }

            return {
              id,
              ...portfolioItem,
              title,
              sections,
              tags
            };
          });
          setItems(itemsArray);
          console.log('Items loaded:', itemsArray.length);
        } else {
          setItems([]);
          console.log('No data in RTDB');
        }
        setConnectionError(null);
      } catch (error: any) {
        console.error('Error processing RTDB data:', error);
        setConnectionError(error.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to portfolio changes:', error);
      setConnectionError(`Database error: ${error.message}`);
      setLoading(false);
      setConnected(false);
    });
  };

  const handleAddProject = async () => {
    // The AddProjectForm already saves to RTDB, so we just need to close the form
    // Real-time listener will automatically update the items
    setShowAddForm(false);
  };

  const onSaveNew = async (data: PortfolioItem) => {
    // This function is not used since AddProjectForm handles saving directly
    const newProjectRef = dbRef(rtdb, `portfolio/${Date.now()}`); // Simple ID generation
    
    await set(newProjectRef, {
      title: data.title,
      client: data.client,
      scale: data.scale,
      map: data.map,
      backgroundImage: data.backgroundImage,
      sections: data.sections,
      images: data.images,
      tags: data.tags,
      createdAt: Date.now()
    });
  };

  const onUpdate = async (id: string, data: PortfolioItem) => {
    const itemRef = dbRef(rtdb, `portfolio/${id}`);
    
    await set(itemRef, {
      title: data.title,
      client: data.client,
      scale: data.scale,
      map: data.map,
      backgroundImage: data.backgroundImage,
      sections: data.sections,
      images: data.images,
      tags: data.tags,
      updatedAt: Date.now()
    });
    // No need to reload - real-time listener will update automatically
  };

  const onDelete = async (id: string) => {
    if (confirm('Удалить этот проект?')) {
      const itemRef = dbRef(rtdb, `portfolio/${id}`);
      await remove(itemRef);
      // No need to reload - real-time listener will update automatically
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">Редактор портфолио</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {connected ? 'Подключено к RTDB' : 'Не подключено к RTDB'}
            </span>
          </div>
        </div>
      </div>

      {connectionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-sm">
            <strong>Ошибка подключения:</strong> {connectionError}
          </div>
          <div className="mt-2 text-xs text-red-600">
            {!rtdb.app.options.databaseURL ? (
              <div>
                <strong>Отсутствует databaseURL в конфигурации Firebase!</strong>
                <br />
                Добавьте в firebase.js:
                <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">
                  databaseURL: "https://gorarch-60f19-default-rtdb.europe-west1.firebasedatabase.app/"
                </pre>
              </div>
            ) : (
              <div>
                Проверьте:
                <ul className="list-disc list-inside mt-1">
                  <li>Правила безопасности Realtime Database</li>
                  <li>URL базы данных: {rtdb.app.options.databaseURL}</li>
                  <li>Подключение к интернету</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!connected && !connectionError && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-700 text-sm">
            <strong>Подключение к базе данных...</strong>
          </div>
          <div className="mt-1 text-xs text-yellow-600">
            Database: {rtdb.app.options.databaseURL}
          </div>
        </div>
      )}
      
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
          disabled={showAddForm}
        >
          Добавить проект
        </button>
        
        {items.length > 0 && (
          <div className="text-sm text-gray-500">
            Всего проектов: {items.length}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6">
          <AddProjectForm
            onSave={handleAddProject}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Загрузка…</div>
        </div>
      ) : items.length === 0 && !showAddForm ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-gray-600 mb-4">
            <h4 className="text-lg font-medium mb-2">Нет проектов в портфолио</h4>
            <p className="text-sm">
              Начните с добавления первого проекта, нажав кнопку "Добавить проект" выше.
            </p>
          </div>
        </div>
      ) : items.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Площадь</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {typeof item.title === 'object' 
                      ? (item.title.ru || Object.values(item.title).find(t => t) || '—')
                      : (item.title || '—')
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.client || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.scale || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => setEditing(item)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors cursor-pointer"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => onDelete(item.id!)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors cursor-pointer"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {editing && (
        <EditorForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={async (data) => {
            if (editing.id) { 
              await onUpdate(editing.id, data); 
            } else { 
              await onSaveNew(data); 
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

function EditorForm({ initial, onCancel, onSave }: { 
  initial: DBItem; 
  onCancel: () => void; 
  onSave: (data: PortfolioItem) => Promise<void>; 
}) {
  // Initialize with proper multilingual structure
  const initializeTitle = (): MultilingualText => {
    if (typeof initial.title === 'string') {
      return { ro: initial.title, ru: initial.title, de: initial.title, en: initial.title };
    } else if (initial.title && typeof initial.title === 'object') {
      return {
        ro: initial.title.ro || '',
        ru: initial.title.ru || '',
        de: initial.title.de || '',
        en: initial.title.en || ''
      };
    }
    return { ro: '', ru: '', de: '', en: '' };
  };

  const initializeSections = (): ProjectSection[] => {
    return (initial.sections || []).map(section => ({
      ...section,
      title: typeof section.title === 'string' 
        ? { ro: section.title, ru: section.title, de: section.title, en: section.title }
        : (section.title || { ro: '', ru: '', de: '', en: '' }),
      description: typeof section.description === 'string'
        ? { ro: section.description, ru: section.description, de: section.description, en: section.description }
        : (section.description || { ro: '', ru: '', de: '', en: '' })
    }));
  };

  const initializeTags = (): MultilingualText => {
    if (Array.isArray((initial as any).tags)) {
      // Convert old array format
      const tagsString = (initial as any).tags.join(', ');
      return { ro: tagsString, ru: tagsString, de: tagsString, en: tagsString };
    } else if ((initial as any).tags && typeof (initial as any).tags === 'object') {
      return {
        ro: (initial as any).tags.ro || '',
        ru: (initial as any).tags.ru || '',
        de: (initial as any).tags.de || '',
        en: (initial as any).tags.en || ''
      };
    } else if (typeof (initial as any).tags === 'string') {
      return {
        ro: (initial as any).tags,
        ru: (initial as any).tags,
        de: (initial as any).tags,
        en: (initial as any).tags
      };
    }
    return { ro: '', ru: '', de: '', en: '' };
  };

  const [title, setTitle] = useState<MultilingualText>(initializeTitle());
  const [client, setClient] = useState(initial.client || '');
  const [scale, setScale] = useState(initial.scale || '');
  const [map, setMap] = useState(initial.map || '');
  const [backgroundImage, setBackgroundImage] = useState(initial.backgroundImage || '');
  const [sections, setSections] = useState<ProjectSection[]>(initializeSections());
  const [images, setImages] = useState<string[]>(initial.images || []);
  const [tags, setTags] = useState<MultilingualText>(initializeTags());
  const [uploading, setUploading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<Language>('ro');

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const createEmptyMultilingualText = (): MultilingualText => ({
    ro: '',
    ru: '',
    de: '',
    en: ''
  });

  const addSection = () => {
    setSections([...sections, { 
      title: createEmptyMultilingualText(), 
      description: createEmptyMultilingualText(), 
      image: '', 
      alignment: 'left' 
    }]);
  };

  const updateSection = (index: number, field: keyof ProjectSection, value: any) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  const updateSectionText = (index: number, field: 'title' | 'description', language: Language, value: string) => {
    const newSections = [...sections];
    newSections[index][field][language] = value;
    setSections(newSections);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageRef = storageRef(storage, `projects/${title.ru || 'untitled'}/background-${Date.now()}.${file.name.split('.').pop()}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      setBackgroundImage(url);
    } catch (error) {
      console.error('Error uploading background image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSectionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageRef = storageRef(storage, `projects/${title.ru || 'untitled'}/section-${sectionIndex}-${Date.now()}.${file.name.split('.').pop()}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      updateSection(sectionIndex, 'image', url);
    } catch (error) {
      console.error('Error uploading section image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const imageRef = storageRef(storage, `projects/${title.ru || 'untitled'}/additional-${Date.now()}-${Math.random()}.${file.name.split('.').pop()}`);
        await uploadBytes(imageRef, file);
        return await getDownloadURL(imageRef);
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading additional images:', error);
      alert('Error uploading images');
    } finally {
      setUploading(false);
    }
  };

  const removeAdditionalImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-6">{initial.id ? 'Редактировать проект' : 'Добавить новый проект'}</h4>
      
      {/* Language Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveLanguage(lang.code)}
              className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                activeLanguage === lang.code
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название ({languages.find(l => l.code === activeLanguage)?.name})
          </label>
          <input 
            value={title[activeLanguage] || ''} 
            onChange={(e) => setTitle(prev => ({ ...prev, [activeLanguage]: e.target.value }))} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Теги ({languages.find(l => l.code === activeLanguage)?.name})
          </label>
          <input 
            value={tags[activeLanguage] || ''} 
            onChange={(e) => setTags(prev => ({ ...prev, [activeLanguage]: e.target.value }))} 
            placeholder="Архитектура, Генеральный план, Дизайн, Конструктив"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Введите теги через запятую для текущего языка
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
          <input 
            value={client} 
            onChange={(e) => setClient(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Площадь</label>
          <input 
            value={scale} 
            onChange={(e) => setScale(e.target.value)} 
            placeholder="например, 3500 м²"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на карту</label>
          <input 
            value={map} 
            onChange={(e) => setMap(e.target.value)} 
            placeholder="https://cloud.agisoft.com/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Фоновое изображение</label>
          <div className="space-y-2">
            <input 
              value={backgroundImage} 
              onChange={(e) => setBackgroundImage(e.target.value)} 
              placeholder="URL изображения или загрузите ниже"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBackgroundImageUpload}
                className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={uploading}
              />
              <span className="text-xs text-gray-500">или загрузите новое изображение</span>
            </div>
            {backgroundImage && (
              <img src={backgroundImage} alt="Background preview" className="w-24 h-16 object-cover rounded border" />
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">Разделы проекта</label>
            <button 
              onClick={addSection}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
              disabled={uploading}
            >
              Добавить раздел
            </button>
          </div>
          
          {sections.map((section, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Раздел {index + 1}</span>
                <button 
                  onClick={() => removeSection(index)}
                  className="text-red-500 text-xs hover:text-red-700 cursor-pointer"
                  disabled={uploading}
                >
                  Удалить
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <input 
                    placeholder={`Заголовок раздела (${languages.find(l => l.code === activeLanguage)?.name})`}
                    value={section.title[activeLanguage] || ''}
                    onChange={(e) => updateSectionText(index, 'title', activeLanguage, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <textarea 
                    placeholder={`Описание раздела (${languages.find(l => l.code === activeLanguage)?.name})`}
                    value={section.description[activeLanguage] || ''}
                    onChange={(e) => updateSectionText(index, 'description', activeLanguage, e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
                
                <input 
                  placeholder="URL изображения или загрузите ниже"
                  value={section.image}
                  onChange={(e) => updateSection(index, 'image', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                />
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleSectionImageUpload(e, index)}
                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    disabled={uploading}
                  />
                  {section.image && (
                    <img src={section.image} alt={`Section ${index + 1} preview`} className="w-12 h-8 object-cover rounded border" />
                  )}
                </div>
                
                <select 
                  value={section.alignment}
                  onChange={(e) => updateSection(index, 'alignment', e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="left">Слева</option>
                  <option value="right">Справа</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Дополнительные изображения</label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept="image/*" 
                multiple
                onChange={handleAdditionalImageUpload}
                className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                disabled={uploading}
              />
              <span className="text-xs text-gray-500">Загрузить несколько изображений</span>
            </div>
            
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imageUrl} 
                      alt={`Additional ${index + 1}`} 
                      className="w-full h-16 object-cover rounded border"
                    />
                    <button
                      onClick={() => removeAdditionalImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      disabled={uploading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <input 
              value={images.join(', ')} 
              onChange={(e) => setImages(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
              placeholder="Или вставьте URL изображений (через запятую)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
          disabled={uploading}
        >
          Отмена
        </button>
        <button 
          onClick={() => {
            onSave({ title, client, scale, map, backgroundImage, sections, images, tags });
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 cursor-pointer"
          disabled={uploading}
        >
          {uploading ? 'Загрузка...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}

export default PortfolioEditor;

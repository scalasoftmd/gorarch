import React, { useState } from 'react';
import { ref as dbRef, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { rtdb, storage } from '../firebase';

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
  tags: MultilingualText; // Changed from string[] to MultilingualText for consistency
}

interface AddProjectFormProps {
  onSave: () => void;
  onCancel: () => void;
}

const AddProjectForm: React.FC<AddProjectFormProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState<MultilingualText>({ ro: '', ru: '', de: '', en: '' });
  const [client, setClient] = useState('');
  const [scale, setScale] = useState('');
  const [map, setMap] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<MultilingualText>({ ro: '', ru: '', de: '', en: '' }); // Changed to MultilingualText
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

  const handleSave = async () => {
    try {
      setUploading(true);
      
      const projectData: PortfolioItem = {
        title,
        client,
        scale,
        map,
        backgroundImage,
        sections,
        images,
        tags // Now properly multilingual
      };

      const newProjectRef = dbRef(rtdb, `portfolio/${Date.now()}`);
      await set(newProjectRef, {
        ...projectData,
        createdAt: Date.now()
      });

      onSave();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Ошибка при сохранении проекта');
    } finally {
      setUploading(false);
    }
  };

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
      const imageRef = storageRef(storage, `projects/${title.ru || 'new-project'}/background-${Date.now()}.${file.name.split('.').pop()}`);
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
      const imageRef = storageRef(storage, `projects/${title.ru || 'new-project'}/section-${sectionIndex}-${Date.now()}.${file.name.split('.').pop()}`);
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
        const imageRef = storageRef(storage, `projects/${title.ru || 'new-project'}/additional-${Date.now()}-${Math.random()}.${file.name.split('.').pop()}`);
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
      <h4 className="text-lg font-semibold text-gray-900 mb-6">Добавить новый проект</h4>
      
      {/* Language Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveLanguage(lang.code)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
      
      {uploading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-blue-700 text-sm">Загрузка...</div>
        </div>
      )}
      
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
            Введите теги через запятую для языка {languages.find(l => l.code === activeLanguage)?.name}
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
              <span className="text-xs text-gray-500">Загрузите изображение (рекомендуется 1080x1920)</span>
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
                  <span className="text-xs text-gray-500">Рекомендуется 1080x1920</span>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Фотопрогресс (галерея)</label>
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
              <span className="text-xs text-gray-500">Загрузить фото для галереи</span>
            </div>
            
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imageUrl} 
                      alt={`Additional ${index + 1}`} 
                      className="w-full h-16 object-cover border"
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
              placeholder="Или вставьте URL изображений для галереи (через запятую)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          disabled={uploading}
        >
          Отмена
        </button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          disabled={uploading}
        >
          {uploading ? 'Сохранение...' : 'Сохранить проект'}
        </button>
      </div>
    </div>
  );
};

export default AddProjectForm;

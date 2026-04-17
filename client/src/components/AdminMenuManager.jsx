import { useEffect, useMemo, useState } from 'react';
import './AdminMenuManager.css';
import { normalizeApiError, parseApiResponse } from '../utils/api';

const MENU_ERROR_OPTIONS = {
  fallback: 'Unable to load admin menu items.',
  unavailable: 'The dashboard could not reach the backend API. Make sure the Express server is running on the configured API port.',
  invalidJson: 'The backend returned invalid JSON while loading menu management data.',
  unauthorized: 'Your admin session expired. Please sign in again.',
};

function getToken() {
  return localStorage.getItem('token');
}

function createEmptyDraft(sections) {
  return {
    id: null,
    sectionId: sections[0]?.section_id ? String(sections[0].section_id) : '',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    displayOrder: '0',
    calories: '',
    isAvailable: true,
    isFeatured: false,
    tags: [],
  };
}

function formatPrice(price) {
  return Number(price).toFixed(2);
}

export default function AdminMenuManager({ onSessionExpired }) {
  const [items, setItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [menuFilter, setMenuFilter] = useState('all');
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminMenu() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/admin/menu/items', {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        const data = await parseApiResponse(response, MENU_ERROR_OPTIONS);

        if (cancelled) {
          return;
        }

        setItems(Array.isArray(data.items) ? data.items : []);
        setSections(Array.isArray(data.sections) ? data.sections : []);
        setTags(Array.isArray(data.tags) ? data.tags : []);
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          onSessionExpired(normalizeApiError(err.message, MENU_ERROR_OPTIONS));
          return;
        }

        if (!cancelled) {
          setError(normalizeApiError(err.message, MENU_ERROR_OPTIONS));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAdminMenu();

    return () => {
      cancelled = true;
    };
  }, [onSessionExpired]);

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesMenu = menuFilter === 'all' || item.menu_name === menuFilter;
    const matchesQuery = !query.trim() || [item.name, item.description, item.section_name, item.menu_name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query.trim().toLowerCase());

    return matchesMenu && matchesQuery;
  }), [items, menuFilter, query]);

  const menuOptions = useMemo(() => [...new Set(sections.map((section) => section.menu_name))], [sections]);

  const beginCreate = () => {
    setEditor(createEmptyDraft(sections));
  };

  const beginEdit = (item) => {
    setEditor({
      id: item.id,
      sectionId: String(item.section_id),
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      imageUrl: item.image_url || '',
      displayOrder: String(item.display_order ?? 0),
      calories: item.calories == null ? '' : String(item.calories),
      isAvailable: item.is_available,
      isFeatured: item.is_featured,
      tags: Array.isArray(item.tags) ? item.tags : [],
    });
  };

  const updateEditor = (field, value) => {
    setEditor((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleDraftTag = (tagName) => {
    setEditor((current) => ({
      ...current,
      tags: current.tags.includes(tagName)
        ? current.tags.filter((tag) => tag !== tagName)
        : [...current.tags, tagName],
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!editor) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        sectionId: Number(editor.sectionId),
        name: editor.name,
        description: editor.description,
        price: Number(editor.price),
        imageUrl: editor.imageUrl,
        displayOrder: Number(editor.displayOrder || 0),
        calories: editor.calories === '' ? null : Number(editor.calories),
        isAvailable: editor.isAvailable,
        isFeatured: editor.isFeatured,
        tags: editor.tags,
      };

      const response = await fetch(
        editor.id ? `/api/admin/menu/items/${editor.id}` : '/api/admin/menu/items',
        {
          method: editor.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await parseApiResponse(response, {
        ...MENU_ERROR_OPTIONS,
        fallback: editor.id ? 'Failed to update menu item.' : 'Failed to create menu item.',
      });

      if (editor.id) {
        setItems((current) => current.map((item) => (
          item.id === data.item.id ? data.item : item
        )));
      } else {
        setItems((current) => [data.item, ...current]);
      }

      setEditor(null);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        onSessionExpired(normalizeApiError(err.message, MENU_ERROR_OPTIONS));
        return;
      }

      setError(normalizeApiError(err.message, {
        ...MENU_ERROR_OPTIONS,
        fallback: editor.id ? 'Failed to update menu item.' : 'Failed to create menu item.',
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const response = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          sectionId: item.section_id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.image_url,
          displayOrder: item.display_order,
          calories: item.calories,
          isAvailable: !item.is_available,
          isFeatured: item.is_featured,
          tags: item.tags,
        }),
      });

      const data = await parseApiResponse(response, {
        ...MENU_ERROR_OPTIONS,
        fallback: 'Failed to update availability.',
      });

      setItems((current) => current.map((entry) => (
        entry.id === data.item.id ? data.item : entry
      )));
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        onSessionExpired(normalizeApiError(err.message, MENU_ERROR_OPTIONS));
        return;
      }

      setError(normalizeApiError(err.message, {
        ...MENU_ERROR_OPTIONS,
        fallback: 'Failed to update availability.',
      }));
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.name}" from the menu?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setError('');

    try {
      const response = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      await parseApiResponse(response, {
        ...MENU_ERROR_OPTIONS,
        fallback: 'Failed to delete menu item.',
      });

      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        onSessionExpired(normalizeApiError(err.message, MENU_ERROR_OPTIONS));
        return;
      }

      setError(normalizeApiError(err.message, {
        ...MENU_ERROR_OPTIONS,
        fallback: 'Failed to delete menu item.',
      }));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="ad-loading">Loading menu manager...</div>;
  }

  return (
    <section className="adm-menu">
      <div className="adm-menu-toolbar">
        <div className="adm-menu-toolbar-top">
          <div>
            <p className="ad-modal-label">Menu management</p>
            <h2 className="ad-modal-title">Edit live menu items</h2>
          </div>
          <button type="button" className="adm-menu-btn is-primary" onClick={beginCreate}>
            Add menu item
          </button>
        </div>

        <div className="adm-menu-toolbar-bottom">
          <input
            type="search"
            className="adm-menu-search"
            placeholder="Search items, sections, or menu types"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="adm-menu-toolbar-bottom">
            <select
              className="adm-menu-select"
              value={menuFilter}
              onChange={(event) => setMenuFilter(event.target.value)}
            >
              <option value="all">All menu types</option>
              {menuOptions.map((menu) => (
                <option key={menu} value={menu}>{menu}</option>
              ))}
            </select>
            <span className="adm-menu-count">{filteredItems.length} items shown</span>
          </div>
        </div>
      </div>

      {error ? <p className="adm-menu-error">{error}</p> : null}

      {filteredItems.length === 0 ? (
        <div className="adm-menu-empty">No menu items match those filters.</div>
      ) : (
        <div className="adm-menu-grid">
          {filteredItems.map((item) => (
            <article key={item.id} className="adm-menu-card">
              <div className="adm-menu-card-top">
                <div>
                  <h3>{item.name}</h3>
                  <p className="adm-menu-count">{item.menu_name} • {item.section_name}</p>
                </div>
                <span className="adm-menu-card-price">${formatPrice(item.price)}</span>
              </div>

              <p className="adm-menu-card-copy">{item.description || 'No description added yet.'}</p>

              <div className="adm-menu-meta">
                <span className={item.is_available ? 'adm-menu-badge' : 'adm-menu-badge is-unavailable'}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </span>
                {item.is_featured ? (
                  <span className="adm-menu-badge is-featured">Featured</span>
                ) : null}
                {item.tags.map((tag) => (
                  <span key={tag} className="adm-menu-badge">{tag}</span>
                ))}
              </div>

              <div className="adm-menu-actions">
                <button type="button" className="adm-menu-btn" onClick={() => beginEdit(item)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="adm-menu-btn"
                  onClick={() => handleToggleAvailability(item)}
                >
                  {item.is_available ? 'Mark unavailable' : 'Make available'}
                </button>
                <button
                  type="button"
                  className="adm-menu-btn is-danger"
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item)}
                >
                  {deletingId === item.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editor ? (
        <div className="ad-overlay" onClick={() => setEditor(null)}>
          <div className="ad-modal" onClick={(event) => event.stopPropagation()}>
            <button className="ad-modal-close" onClick={() => setEditor(null)}>x</button>

            <div className="ad-modal-header">
              <div>
                <p className="ad-modal-label">{editor.id ? 'Edit item' : 'Create item'}</p>
                <h2 className="ad-modal-title">
                  {editor.id ? 'Update menu item' : 'Add menu item'}
                </h2>
              </div>
            </div>

            <form className="adm-menu-form" onSubmit={handleSave}>
              <div className="adm-menu-form-grid">
                <label htmlFor="menu-section">
                  Section
                  <select
                    id="menu-section"
                    value={editor.sectionId}
                    onChange={(event) => updateEditor('sectionId', event.target.value)}
                  >
                    {sections.map((section) => (
                      <option key={section.section_id} value={section.section_id}>
                        {section.menu_name} • {section.section_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label htmlFor="menu-price">
                  Price
                  <input
                    id="menu-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editor.price}
                    onChange={(event) => updateEditor('price', event.target.value)}
                  />
                </label>

                <label htmlFor="menu-name">
                  Item name
                  <input
                    id="menu-name"
                    type="text"
                    value={editor.name}
                    onChange={(event) => updateEditor('name', event.target.value)}
                  />
                </label>

                <label htmlFor="menu-image">
                  Image URL
                  <input
                    id="menu-image"
                    type="text"
                    value={editor.imageUrl}
                    onChange={(event) => updateEditor('imageUrl', event.target.value)}
                  />
                </label>

                <label htmlFor="menu-order">
                  Display order
                  <input
                    id="menu-order"
                    type="number"
                    min="0"
                    step="1"
                    value={editor.displayOrder}
                    onChange={(event) => updateEditor('displayOrder', event.target.value)}
                  />
                </label>

                <label htmlFor="menu-calories">
                  Calories
                  <input
                    id="menu-calories"
                    type="number"
                    min="0"
                    step="1"
                    value={editor.calories}
                    onChange={(event) => updateEditor('calories', event.target.value)}
                  />
                </label>
              </div>

              <label htmlFor="menu-description">
                Description
                <textarea
                  id="menu-description"
                  value={editor.description}
                  onChange={(event) => updateEditor('description', event.target.value)}
                />
              </label>

              <div className="adm-menu-checkboxes">
                <label htmlFor="menu-available">
                  <input
                    id="menu-available"
                    type="checkbox"
                    checked={editor.isAvailable}
                    onChange={(event) => updateEditor('isAvailable', event.target.checked)}
                  />
                  Available
                </label>

                <label htmlFor="menu-featured">
                  <input
                    id="menu-featured"
                    type="checkbox"
                    checked={editor.isFeatured}
                    onChange={(event) => updateEditor('isFeatured', event.target.checked)}
                  />
                  Featured
                </label>
              </div>

              <div>
                <p className="ad-modal-label">Dietary tags</p>
                <div className="adm-menu-tag-grid">
                  {tags.map((tag) => (
                    <label key={tag.tag_id} className="adm-menu-tag-option" htmlFor={`tag-${tag.tag_id}`}>
                      <input
                        id={`tag-${tag.tag_id}`}
                        type="checkbox"
                        checked={editor.tags.includes(tag.name)}
                        onChange={() => toggleDraftTag(tag.name)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="adm-menu-actions">
                <button type="submit" className="adm-menu-btn is-primary" disabled={saving}>
                  {saving ? 'Saving...' : editor.id ? 'Save changes' : 'Create item'}
                </button>
                <button type="button" className="adm-menu-btn" onClick={() => setEditor(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

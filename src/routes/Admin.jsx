import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../data/adminApi.js';
import '../styles/admin.css';

const EMPTY_FORM = { id: null, question: '', answer: '', notes: '', categories: [] };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function newId() {
  return `${Date.now()}${Math.random().toString(36).slice(2, 12)}`;
}

export default function Admin() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [message, setMessage] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/flashcards.json', { cache: 'no-store' });
      const data = await res.json();
      setCards(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const allCategories = useMemo(() => {
    const set = new Set();
    cards.forEach(c => (c.categories || []).forEach(cat => set.add(cat)));
    return Array.from(set).sort();
  }, [cards]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter(c => {
      if (categoryFilter && !(c.categories || []).includes(categoryFilter)) return false;
      if (!q) return true;
      return (
        c.question?.toLowerCase().includes(q) ||
        c.answer?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q) ||
        (c.categories || []).some(cat => cat.toLowerCase().includes(q))
      );
    });
  }, [cards, search, categoryFilter]);

  function notify(text, kind = 'success') {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), 2500);
  }

  function startEdit(card) {
    setForm({
      id: card.id,
      question: card.question || '',
      answer: card.answer || '',
      notes: card.notes || '',
      categories: [...(card.categories || [])],
    });
    setTagInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setForm(EMPTY_FORM);
    setTagInput('');
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    if (form.categories.includes(tag)) { setTagInput(''); return; }
    setForm(f => ({ ...f, categories: [...f.categories, tag] }));
    setTagInput('');
  }

  function removeTag(tag) {
    setForm(f => ({ ...f, categories: f.categories.filter(c => c !== tag) }));
  }

  async function save(e) {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      notify('Question and answer are required', 'error');
      return;
    }
    const existing = form.id ? cards.find(c => c.id === form.id) : null;
    const card = {
      id: form.id || newId(),
      question: form.question.trim(),
      answer: form.answer.trim(),
      notes: form.notes.trim(),
      categories: form.categories,
      correct: existing?.correct ?? 0,
      incorrect: existing?.incorrect ?? 0,
      dateAdded: existing?.dateAdded ?? todayIso(),
    };
    try {
      if (form.id) {
        await adminApi.edit(form.id, card);
        notify('Card updated');
      } else {
        await adminApi.add(card);
        notify('Card added');
      }
      cancelEdit();
      refresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function destroy(card) {
    if (!confirm(`Delete "${card.question}"?`)) return;
    try {
      await adminApi.remove(card.id);
      notify('Card deleted');
      if (form.id === card.id) cancelEdit();
      refresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🛠️ Flashcard Admin</h1>
        <p>Dev-only management page. Stats are tracked in the browser, not here.</p>
      </div>

      {message ? <div className={`admin-msg ${message.kind}`}>{message.text}</div> : null}

      <form className="admin-form" onSubmit={save}>
        <h2>{form.id ? 'Edit flashcard' : 'Add flashcard'}</h2>

        <div className="form-row">
          <label>Question (English)</label>
          <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
        </div>
        <div className="form-row">
          <label>Answer (Italian)</label>
          <input value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} />
        </div>
        <div className="form-row">
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <div className="form-row">
          <label>Categories</label>
          <input
            list="adminCategoryList"
            value={tagInput}
            placeholder="Type a category, then press Enter"
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(); }
            }}
          />
          <datalist id="adminCategoryList">
            {allCategories.map(cat => <option key={cat} value={cat} />)}
          </datalist>
          <div className="tag-pills">
            {form.categories.map(cat => (
              <span key={cat} className="tag-pill">
                {cat}
                <button type="button" onClick={() => removeTag(cat)}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="admin-actions">
          <button type="submit" className="btn-primary">{form.id ? 'Save edits' : 'Add card'}</button>
          {form.id ? <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button> : null}
        </div>
      </form>

      <div className="admin-list">
        <div className="admin-search">
          <input
            placeholder="Search question / answer / notes / category"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <span style={{ alignSelf: 'center' }}>{filtered.length} / {cards.length}</span>
        </div>

        {loading ? <div>Loading...</div> : null}

        {filtered.map(card => (
          <div className="admin-list-item" key={card.id}>
            <div className="meta">
              <strong>{card.question}</strong> → {card.answer}
              <div><small>
                {(card.categories || []).join(', ') || 'uncategorized'}
                {' · '}added {card.dateAdded || '—'}
                {' · '}✓ {card.correct ?? 0}  ✗ {card.incorrect ?? 0}
              </small></div>
              {card.notes ? <div><small>{card.notes}</small></div> : null}
            </div>
            <button className="btn-secondary" onClick={() => startEdit(card)}>Edit</button>
            <button className="btn-incorrect" onClick={() => destroy(card)}>Delete</button>
          </div>
        ))}
      </div>

      <div className="back-link" style={{ marginTop: 20 }}>
        <Link to="/">← Back to Home</Link>
      </div>
    </div>
  );
}

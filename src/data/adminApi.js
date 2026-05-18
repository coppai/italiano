async function send(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export const adminApi = {
  add: card => send('POST', '/api/add-flashcard', card),
  edit: (id, flashcard) => send('PUT', '/api/edit-flashcard', { id, flashcard }),
  remove: id => send('DELETE', '/api/delete-flashcard', { id }),
  bulkReplace: cards => send('POST', '/api/flashcards', cards),
};

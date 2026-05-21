export function getActiveNoteQuery(textarea) {
  if (!textarea) return null;

  const caret = textarea.selectionStart ?? 0;
  const beforeCaret = textarea.value.slice(0, caret);
  const match = beforeCaret.match(/(^|\s)([@#][a-zA-Z0-9_.:-]*)$/);

  if (!match) return null;

  const token = match[2];
  return {
    trigger: token.slice(0, 1),
    token,
    query: token.slice(1),
    start: caret - token.length,
    end: caret
  };
}

export function getActiveIntentQuery(textarea) {
  const query = getActiveNoteQuery(textarea);
  return query?.trigger === "@" ? query : null;
}

export function insertNoteToken(textarea, activeQuery, token) {
  if (!textarea || !activeQuery || !token) return null;

  const value = textarea.value;
  const needsSpace = value.slice(activeQuery.end, activeQuery.end + 1) !== " ";
  const replacement = `${token}${needsSpace ? " " : ""}`;
  const nextValue =
    value.slice(0, activeQuery.start) + replacement + value.slice(activeQuery.end);
  const nextCaret = activeQuery.start + replacement.length;

  textarea.value = nextValue;
  textarea.focus();
  textarea.setSelectionRange(nextCaret, nextCaret);

  return nextValue;
}

export function insertIntentToken(textarea, activeQuery, tag) {
  return insertNoteToken(textarea, activeQuery, tag);
}

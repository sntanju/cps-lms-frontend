'use client';

import { useState } from 'react';
import { apiFetch, readError } from '@/lib/api';
import { QuizQuestion } from '@/lib/types';

function validate(text: string, options: string[], correctIndex: number) {
  if (!text.trim()) {
    return 'The question needs some text.';
  }

  if (options.length < 2) {
    return 'A question needs at least two options.';
  }

  if (options.some((option) => !option.trim())) {
    return 'Every option needs text.';
  }

  if (correctIndex < 0 || correctIndex >= options.length) {
    return 'Choose which option is the correct answer.';
  }

  return '';
}

export function QuestionEditor({
  question,
  quizId,
  index,
  onSaved,
  onCancel,
}: {
  question: QuizQuestion | null;
  quizId: number;
  index: number;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [text, setText] = useState(question?.text ?? '');
  const [options, setOptions] = useState<string[]>(question?.options ?? ['', '']);
  
  const [correctIndex, setCorrectIndex] = useState(question?.correctIndex ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setOption(position: number, value: string) {
    setOptions(options.map((option, i) => (i === position ? value : option)));
  }

  function addOption() {
    setOptions([...options, '']);
  }

  function removeOption(position: number) {
    const remaining = options.filter((_, i) => i !== position);

    setOptions(remaining);

    if (correctIndex === position) {
      setCorrectIndex(0);
    } else if (correctIndex > position) {
      setCorrectIndex(correctIndex - 1);
    }
  }

  async function handleSave() {
    const message = validate(text, options, correctIndex);

    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError('');

    const body = JSON.stringify({
      data: {
        text: text.trim(),
        options: options.map((option) => option.trim()),
        correctIndex,
        quiz: quizId,
      },
    });

    const response = question
      ? await apiFetch(`/api/questions/${question.documentId}`, { method: 'PUT', body })
      : await apiFetch('/api/questions', { method: 'POST', body });

    if (!response.ok) {
      setError(
        response.status === 403
          ? 'You do not have permission to edit this quiz.'
          : await readError(response, 'Could not save this question'),
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  }

  async function handleDelete() {
    if (!question || !window.confirm('Delete this question?')) {
      return;
    }

    setSaving(true);

    const response = await apiFetch(`/api/questions/${question.documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      setError(await readError(response, 'Could not delete this question'));
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="rounded border border-gray-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Question {index}
      </p>

      {error && (
        <p className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What do you want to ask?"
        className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
      />

      <p className="mt-4 text-sm font-medium">
        Options <span className="font-normal text-gray-500">(pick the correct one)</span>
      </p>

      <ul className="mt-2 space-y-2">
        {options.map((option, position) => (
          <li key={position} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${question?.documentId ?? 'new'}`}
              checked={correctIndex === position}
              onChange={() => setCorrectIndex(position)}
              aria-label={`Option ${position + 1} is correct`}
            />
            <input
              value={option}
              onChange={(e) => setOption(position, e.target.value)}
              placeholder={`Option ${position + 1}`}
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeOption(position)}
              disabled={options.length <= 2}
              className="text-sm text-gray-500 hover:underline disabled:opacity-40"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addOption}
        className="mt-2 text-sm text-gray-600 hover:underline"
      >
        + Add option
      </button>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : question ? 'Save question' : 'Add question'}
        </button>

        {question && (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="text-sm text-red-700 hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        )}

        {onCancel && (
          <button onClick={onCancel} className="text-sm text-gray-600 hover:underline">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

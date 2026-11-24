import { useState, type FormEvent } from 'react';
import { CATALOG } from '../../config/catalog';
import { describeError } from '../../lib/errors';
import { isValidSymbol, normalizeSymbol } from '../../lib/symbols';

interface CompanyFormProps {
  /** Currently charted symbol, shown as the initial input value. */
  selected: string | null;
  onSubmit: (symbol: string) => void;
  onClear: () => void;
}

/** Ticker input with catalog suggestions. Validates format locally, so bad input never triggers a request. */
export function CompanyForm({ selected, onSubmit, onClear }: CompanyFormProps) {
  const [draft, setDraft] = useState(selected ?? '');
  const [invalid, setInvalid] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const symbol = normalizeSymbol(draft);
    if (!isValidSymbol(symbol)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(symbol);
    onSubmit(symbol);
  }

  function handleClear() {
    setDraft('');
    setInvalid(false);
    onClear();
  }

  return (
    <form className="company-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="company-symbol">Company ticker</label>
      <input
        id="company-symbol"
        name="symbol"
        type="text"
        list="company-suggestions"
        value={draft}
        maxLength={10}
        autoComplete="off"
        spellCheck={false}
        placeholder="e.g. NVDA"
        aria-invalid={invalid}
        aria-describedby={invalid ? 'company-symbol-error' : undefined}
        onChange={(event) => setDraft(event.target.value)}
      />
      <datalist id="company-suggestions">
        {CATALOG.map((company) => (
          <option key={company.symbol} value={company.symbol}>
            {company.name}
          </option>
        ))}
      </datalist>
      <button type="submit" className="button">
        Show chart
      </button>
      {selected ? (
        <button type="button" className="button button--secondary" onClick={handleClear}>
          Clear
        </button>
      ) : null}
      {invalid ? (
        <p id="company-symbol-error" className="company-form__error" role="alert">
          {describeError('INVALID_SYMBOL')} Use 1-10 letters, digits, "." or "-".
        </p>
      ) : null}
    </form>
  );
}

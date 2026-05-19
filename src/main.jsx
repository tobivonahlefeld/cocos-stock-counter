import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const BASE_DRINKS = [
  'Desp',
  'Heineken',
  'Heineken 0',
  'Birra 0',
  'Affligem 0',
  'Brand 0',
  'Amstel Radler 0',
  'Duvel',
  'La chouffe',
  'Double Dutch',
  'Rb sugar free',
  'Rb yellow',
  'Rb red',
  'Rb',
  'Stelz mango',
  'Stelz lemon',
  'Stelz peach',
  'Westmalle',
  'Affligem triple',
  'Affligem double',
  'Leffe blonde',
  'Paulaner',
  'Beck',
  'Orangina',
  'Tonic',
  'Cassis',
  'Ginger ale',
  '7 up',
  'Lipton green',
  'Pepsi max',
  'Pepsi',
  'Bud',
  'Zatte triple',
  'Ijwit',
  'Bundaberg',
  'Ginger beer',
  'Two chefs brewing',
  'Lipton',
  'Lemon',
  'Sourcy red',
  'Sourcy blue',
  'Tomato',
  'Magners',
  'Corona',
  'Sol',
  'Apple bandit',
  'Mannen liefde',
];

const COUNTS_KEY = 'bar-stock-counter-counts-v1';
const CUSTOM_DRINKS_KEY = 'bar-stock-counter-custom-drinks-v1';

const makeBaseId = (name, index) =>
  `base-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

const baseDrinks = BASE_DRINKS.map((name, index) => ({
  id: makeBaseId(name, index),
  name,
  custom: false,
}));

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [counts, setCounts] = useState(() => readJson(COUNTS_KEY, {}));
  const [customDrinks, setCustomDrinks] = useState(() =>
    readJson(CUSTOM_DRINKS_KEY, [])
  );
  const [search, setSearch] = useState('');
  const [showNeededOnly, setShowNeededOnly] = useState(false);
  const [newDrink, setNewDrink] = useState('');
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
  }, [counts]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_DRINKS_KEY, JSON.stringify(customDrinks));
  }, [customDrinks]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then(() => {
      setOfflineReady(true);
    });
  }, []);

  const drinks = useMemo(() => [...baseDrinks, ...customDrinks], [customDrinks]);

  const filteredDrinks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return drinks.filter((drink) => {
      const matchesSearch = drink.name.toLowerCase().includes(normalizedSearch);
      const hasQuantity = (counts[drink.id] || 0) > 0;
      return matchesSearch && (!showNeededOnly || hasQuantity);
    });
  }, [counts, drinks, search, showNeededOnly]);

  const totalItems = useMemo(
    () => Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0),
    [counts]
  );

  const activeRows = useMemo(
    () => drinks.filter((drink) => (counts[drink.id] || 0) > 0).length,
    [counts, drinks]
  );

  function updateCount(id, change) {
    setCounts((currentCounts) => {
      const nextQuantity = Math.max(0, (currentCounts[id] || 0) + change);
      return { ...currentCounts, [id]: nextQuantity };
    });
  }

  function resetCounts() {
    setCounts({});
  }

  function addDrink(event) {
    event.preventDefault();

    const name = newDrink.trim().replace(/\s+/g, ' ');
    if (!name) return;

    const existingDrink = drinks.find(
      (drink) => drink.name.toLowerCase() === name.toLowerCase()
    );

    if (existingDrink) {
      setSearch(name);
      setNewDrink('');
      return;
    }

    setCustomDrinks((currentDrinks) => [
      ...currentDrinks,
      {
        id: `custom-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        custom: true,
      },
    ]);
    setNewDrink('');
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Basement run</p>
          <h1>Coco's Outback</h1>
          <p className="subhead">Stock counter</p>
        </div>
        <button className="reset-button" type="button" onClick={resetCounts}>
          Reset
        </button>
      </header>

      <section className="offline-card" aria-label="Offline status">
        <div>
          <span>{offlineReady ? 'Offline ready' : 'Saving offline copy'}</span>
          <p>
            {isStandalone
              ? 'Home Screen mode'
              : 'Add to Home Screen after opening the hosted app once.'}
          </p>
        </div>
      </section>

      <section className="summary" aria-label="Current restock summary">
        <div>
          <span>{totalItems}</span>
          <p>Total missing</p>
        </div>
        <div>
          <span>{activeRows}</span>
          <p>Drinks to restock</p>
        </div>
      </section>

      <section className="controls" aria-label="List controls">
        <label className="search-label" htmlFor="drink-search">
          Search
          <input
            id="drink-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a drink"
          />
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={showNeededOnly}
            onChange={(event) => setShowNeededOnly(event.target.checked)}
          />
          <span>Show only needed</span>
        </label>
      </section>

      <form className="add-drink" onSubmit={addDrink}>
        <label htmlFor="new-drink">Add drink</label>
        <div>
          <input
            id="new-drink"
            type="text"
            value={newDrink}
            onChange={(event) => setNewDrink(event.target.value)}
            placeholder="New drink name"
          />
          <button type="submit">Add</button>
        </div>
      </form>

      <section className="drink-list" aria-label="Drink counters">
        <div className="list-heading">
          <span>Drinks</span>
          <span>{filteredDrinks.length} shown</span>
        </div>
        {filteredDrinks.length > 0 ? (
          filteredDrinks.map((drink) => (
            <article className="drink-row" key={drink.id}>
              <div className="drink-name">
                <span>{drink.name}</span>
                {drink.custom && <small>Custom</small>}
              </div>

              <div className="counter" aria-label={`${drink.name} quantity`}>
                <button
                  type="button"
                  className="counter-button"
                  onClick={() => updateCount(drink.id, -1)}
                  disabled={(counts[drink.id] || 0) === 0}
                  aria-label={`Subtract one ${drink.name}`}
                >
                  -
                </button>
                <output aria-live="polite">{counts[drink.id] || 0}</output>
                <button
                  type="button"
                  className="counter-button plus"
                  onClick={() => updateCount(drink.id, 1)}
                  aria-label={`Add one ${drink.name}`}
                >
                  +
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">No drinks match this view.</p>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

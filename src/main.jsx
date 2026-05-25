import React, { useEffect, useMemo, useRef, useState } from 'react';
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
const COLLECTED_KEY = 'bar-stock-counter-collected-v1';
const SORT_KEY = 'bar-stock-counter-sort-v1';
const ORDER_KEY = 'bar-stock-counter-manual-order-v1';
const CLEANING_KEY = 'bar-stock-counter-cleaning-v1';
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, index) => index);

const CLEANING_SECTIONS = [
  {
    title: 'Sexy Bar',
    items: [
      'Beer Side',
      'Beer taps wiped',
      'Top grill cleaned inside and out',
      'Glass rack/ice area',
      'Slushie machine',
      'Condiment shelf',
      'Blenders',
      'Tops of beer fridges wiped',
      'Cocktail section',
      'Fruits wrapped',
      'Bain Marie wiped',
      'Alcohol shelf wiped',
      'Alcohol bottles wiped',
      'Fridge wiped down outside',
      'Fridge seals wiped',
      'Fridge glass cleaned',
      'Softie tap/Guinness tap soaked',
      'Bottle cap container cleaned',
      'POS/Pin machine/printer wiped',
      'All bottles covered',
      'Silver fridge moved and cleaned under',
      'Pitcher shelf',
      'Slushie machine drained and cleaned',
      'Restocked',
      'Empty bottles from the bar',
    ],
  },
  {
    title: 'Main Bar',
    items: [
      'Right hand side section cleaned',
      'Main area cleaned',
      'Beer taps wiped',
      'Top grill cleaned inside and out',
      'Back bar emptied and cleaned',
      'Speed rail cleaned inside and out',
      'Bottles in speed rail wiped',
      'Coffee machine cleaned',
      'Under coffee machine wiped',
      'Under shot tube fridge wiped',
      'Milk fridge cleaned inside',
      'Softie tap/Guinness tap soaked',
      'All fridge handles wiped',
      'Fridge glass cleaned',
      'All bottles covered',
      'POS/Pin machine/printers wiped',
      'All items out of fridge',
      'Drawers under coffee machine cleaned',
      'All stuff from shelves put on top of bar',
      'Restocked',
    ],
  },
  {
    title: 'Corner Bar',
    items: [
      'Main area cleaned',
      'Beer taps wiped',
      'Top grill cleaned inside and out',
      'Speed rail cleaned inside and out',
      'Speed rail bottles wiped',
      'Back bar emptied and cleaned',
      'Fridge handles cleaned',
      'Fridge glass cleaned',
      'All bottles covered',
      'All items out of fridge',
      'Restocked',
    ],
  },
  {
    title: 'Shooter Bar',
    items: [
      'Main area cleaned',
      'Fruits wrapped',
      'Fruits put away into fruit fridge',
      'All bottles wiped',
      'All bottles covered',
      'Fridge area properly covered',
      'Bottles and fruit area covered with bag',
      'Shelf fridge wiped inside and out',
      'Restocked',
    ],
  },
  {
    title: 'Glass Room',
    items: [
      'Ash trays in last',
      'Machine drained',
      'All machine parts taken out and washed',
      'Inside machine rinsed',
      'Machine put back together properly',
      'Sink items washed and put in machine',
      'All surfaces cleaned',
      'Silver fridge cleaned',
      'Machine outside cleaned',
      'Sink cleaned',
      'White tubs put on top of shelf',
      'Everything removed and shelf cleaned',
      'All crates/trays/glass bins taken outside',
      'Crates sorted',
    ],
  },
  {
    title: 'General',
    items: [
      'Top bar cleaned and dried',
      'Mats removed from bar and laid outside',
      'Mats from shooter bar removed',
      'Bottle bins removed and thrown in bin',
      'All trays put upstairs in kitchen',
      'Mats and bottle bins sprayed',
      'Mats stacked neatly away from the door',
      'Bottle bins returned inside',
      'Smoke machines off',
      'All fans off',
      'Fan upstairs off',
      'Stock room clean',
      'Keg area clean',
      "Menu's removed from blocks",
      'Waiter stands cleaned along all shelves',
      'Bin bags from all bars in big bin',
      'Doors locked',
      "All TV's off",
      'Walkies check',
    ],
  },
];

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

function makeManualOrder(drinks, savedOrder) {
  const drinkIds = new Set(drinks.map((drink) => drink.id));
  const orderedIds = [];

  savedOrder.forEach((id) => {
    if (drinkIds.has(id) && !orderedIds.includes(id)) orderedIds.push(id);
  });

  drinks.forEach((drink) => {
    if (!orderedIds.includes(drink.id)) orderedIds.push(drink.id);
  });

  return orderedIds;
}

const makeCleaningId = (sectionTitle, item, index) =>
  `${sectionTitle}-${index}-${item}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function App() {
  const [activeTab, setActiveTab] = useState('stock');
  const [counts, setCounts] = useState(() => readJson(COUNTS_KEY, {}));
  const [collected, setCollected] = useState(() => readJson(COLLECTED_KEY, {}));
  const [cleaningDone, setCleaningDone] = useState(() =>
    readJson(CLEANING_KEY, {})
  );
  const [customDrinks, setCustomDrinks] = useState(() =>
    readJson(CUSTOM_DRINKS_KEY, [])
  );
  const [search, setSearch] = useState('');
  const [showNeededOnly, setShowNeededOnly] = useState(false);
  const [sortMode, setSortMode] = useState(() => readJson(SORT_KEY, 'manual'));
  const [manualOrder, setManualOrder] = useState(() => readJson(ORDER_KEY, []));
  const [newDrink, setNewDrink] = useState('');
  const [offlineReady, setOfflineReady] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const completionStateRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
  }, [counts]);

  useEffect(() => {
    localStorage.setItem(COLLECTED_KEY, JSON.stringify(collected));
  }, [collected]);

  useEffect(() => {
    localStorage.setItem(CLEANING_KEY, JSON.stringify(cleaningDone));
  }, [cleaningDone]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_DRINKS_KEY, JSON.stringify(customDrinks));
  }, [customDrinks]);

  useEffect(() => {
    localStorage.setItem(SORT_KEY, JSON.stringify(sortMode));
  }, [sortMode]);

  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(manualOrder));
  }, [manualOrder]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then(() => {
      setOfflineReady(true);
    });
  }, []);

  const drinks = useMemo(() => [...baseDrinks, ...customDrinks], [customDrinks]);

  const manualDrinks = useMemo(() => {
    const drinksById = new Map(drinks.map((drink) => [drink.id, drink]));
    return makeManualOrder(drinks, manualOrder).map((id) => drinksById.get(id));
  }, [drinks, manualOrder]);

  const sortedDrinks = useMemo(() => {
    if (sortMode === 'manual') return manualDrinks;
    if (sortMode === 'basement') return drinks;

    return [...drinks].sort((firstDrink, secondDrink) =>
      firstDrink.name.localeCompare(secondDrink.name, undefined, {
        sensitivity: 'base',
      })
    );
  }, [drinks, manualDrinks, sortMode]);

  const filteredDrinks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return sortedDrinks.filter((drink) => {
      const matchesSearch = drink.name.toLowerCase().includes(normalizedSearch);
      const hasQuantity = (counts[drink.id] || 0) > 0;
      return matchesSearch && (!showNeededOnly || hasQuantity);
    });
  }, [counts, search, showNeededOnly, sortedDrinks]);

  const totalItems = useMemo(
    () => Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0),
    [counts]
  );

  const activeRows = useMemo(
    () => drinks.filter((drink) => (counts[drink.id] || 0) > 0).length,
    [counts, drinks]
  );

  const collectedRows = useMemo(
    () =>
      drinks.filter(
        (drink) => (counts[drink.id] || 0) > 0 && collected[drink.id]
      ).length,
    [collected, counts, drinks]
  );

  const cleaningTotal = useMemo(
    () =>
      CLEANING_SECTIONS.reduce(
        (total, section) => total + section.items.length,
        0
      ),
    []
  );

  const cleaningCompleted = useMemo(
    () =>
      CLEANING_SECTIONS.reduce(
        (total, section) =>
          total +
          section.items.filter((item, index) =>
            cleaningDone[makeCleaningId(section.title, item, index)]
          ).length,
        0
      ),
    [cleaningDone]
  );

  useEffect(() => {
    const isComplete = activeRows > 0 && collectedRows === activeRows;

    if (completionStateRef.current === null) {
      completionStateRef.current = isComplete;
      return;
    }

    if (isComplete && !completionStateRef.current) {
      setShowCelebration(true);
      window.setTimeout(() => setShowCelebration(false), 2800);
    }

    completionStateRef.current = isComplete;
  }, [activeRows, collectedRows]);

  function updateCount(id, change) {
    const currentQuantity = counts[id] || 0;

    setCounts((currentCounts) => {
      const nextQuantity = Math.max(0, (currentCounts[id] || 0) + change);
      return { ...currentCounts, [id]: nextQuantity };
    });

    if (change < 0 && currentQuantity <= 1) {
      setCollected((currentCollected) => ({
        ...currentCollected,
        [id]: false,
      }));
    }
  }

  function setCount(id, value) {
    const nextQuantity = Math.max(0, Number.parseInt(value, 10) || 0);

    setCounts((currentCounts) => ({
      ...currentCounts,
      [id]: nextQuantity,
    }));

    if (nextQuantity === 0) {
      setCollected((currentCollected) => ({
        ...currentCollected,
        [id]: false,
      }));
    }
  }

  function resetCounts() {
    setCounts({});
    setCollected({});
  }

  function resetCleaning() {
    setCleaningDone({});
  }

  function toggleCleaningItem(sectionTitle, item, index) {
    const id = makeCleaningId(sectionTitle, item, index);
    setCleaningDone((currentDone) => ({
      ...currentDone,
      [id]: !currentDone[id],
    }));
  }

  function toggleCollected(id) {
    if ((counts[id] || 0) === 0) return;

    setCollected((currentCollected) => ({
      ...currentCollected,
      [id]: !currentCollected[id],
    }));
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

  function removeCustomDrink(id) {
    setCustomDrinks((currentDrinks) =>
      currentDrinks.filter((drink) => drink.id !== id)
    );

    setCounts((currentCounts) => {
      const nextCounts = { ...currentCounts };
      delete nextCounts[id];
      return nextCounts;
    });

    setCollected((currentCollected) => {
      const nextCollected = { ...currentCollected };
      delete nextCollected[id];
      return nextCollected;
    });

    setManualOrder((currentOrder) =>
      currentOrder.filter((drinkId) => drinkId !== id)
    );
  }

  function moveDrink(id, direction) {
    setSortMode('manual');
    setManualOrder((currentOrder) => {
      const nextOrder = makeManualOrder(drinks, currentOrder);
      const currentIndex = nextOrder.indexOf(id);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= nextOrder.length) {
        return nextOrder;
      }

      const movingDrink = nextOrder[currentIndex];
      nextOrder[currentIndex] = nextOrder[nextIndex];
      nextOrder[nextIndex] = movingDrink;
      return nextOrder;
    });
  }

  return (
    <main className="app-shell">
      {showCelebration && (
        <div className="celebration" aria-live="polite" aria-label="All drinks collected">
          <div className="celebration-card">
            <span>Stock run complete</span>
          </div>
          {CONFETTI_PIECES.map((piece) => (
            <i
              key={piece}
              style={{
                '--delay': `${(piece % 8) * 80}ms`,
                '--drift': `${((piece % 7) - 3) * 22}px`,
                '--left': `${(piece * 37) % 100}%`,
                '--spin': `${piece * 24}deg`,
              }}
            />
          ))}
        </div>
      )}

      <header className="app-header">
        <div className="brand-lockup">
          <div>
            <h1>Coco's Outback</h1>
            <p className="subhead">
              {activeTab === 'stock' ? 'Stock counter' : 'Closing checklist'}
            </p>
          </div>
        </div>
        <button
          className="reset-button"
          type="button"
          onClick={activeTab === 'stock' ? resetCounts : resetCleaning}
        >
          Reset
        </button>
      </header>

      <nav className="tab-nav" aria-label="App sections">
        <button
          type="button"
          className={activeTab === 'stock' ? 'is-active' : ''}
          onClick={() => setActiveTab('stock')}
        >
          Stock
        </button>
        <button
          type="button"
          className={activeTab === 'closing' ? 'is-active' : ''}
          onClick={() => setActiveTab('closing')}
        >
          Closing
        </button>
      </nav>

      {activeTab === 'stock' ? (
        <>
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
          <span>
            {collectedRows}/{activeRows}
          </span>
          <p>Collected</p>
        </div>
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

        <label className="sort-control" htmlFor="sort-mode">
          Sort
          <select
            id="sort-mode"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value)}
          >
            <option value="manual">Manual order</option>
            <option value="basement">Basement order</option>
            <option value="az">A-Z</option>
          </select>
        </label>
      </section>

      <section className="drink-list" aria-label="Drink counters">
        <div className="list-heading">
          <span>Drinks</span>
          <span>{filteredDrinks.length} shown</span>
        </div>
        {filteredDrinks.length > 0 ? (
          filteredDrinks.map((drink) => {
            const quantity = counts[drink.id] || 0;
            const isCollected = Boolean(collected[drink.id]);
            const manualIndex = manualDrinks.findIndex(
              (manualDrink) => manualDrink.id === drink.id
            );

            return (
              <article
                className={`drink-row ${isCollected ? 'is-collected' : ''} ${
                  sortMode === 'manual' ? 'is-manual-order' : ''
                }`}
                key={drink.id}
              >
                {sortMode === 'manual' && (
                  <div className="reorder-controls" aria-label={`${drink.name} order controls`}>
                    <button
                      type="button"
                      onClick={() => moveDrink(drink.id, -1)}
                      disabled={manualIndex <= 0}
                      aria-label={`Move ${drink.name} up`}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDrink(drink.id, 1)}
                      disabled={manualIndex === manualDrinks.length - 1}
                      aria-label={`Move ${drink.name} down`}
                    >
                      Down
                    </button>
                  </div>
                )}
                <div className="drink-name">
                  <button
                    type="button"
                    className="collected-button"
                    onClick={() => toggleCollected(drink.id)}
                    disabled={quantity === 0}
                    aria-pressed={isCollected}
                    aria-label={
                      isCollected
                        ? `Mark ${drink.name} as not collected`
                        : `Mark ${drink.name} as collected`
                    }
                  >
                    <span className="tick-box" aria-hidden="true">
                      {isCollected ? 'X' : ''}
                    </span>
                    <span className="drink-title">{drink.name}</span>
                  </button>
                  {drink.custom && (
                    <div className="custom-actions">
                      <small>Custom</small>
                      <button
                        type="button"
                        className="remove-drink-button"
                        onClick={() => removeCustomDrink(drink.id)}
                        aria-label={`Remove ${drink.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="counter" aria-label={`${drink.name} quantity`}>
                  <button
                    type="button"
                    className="counter-button"
                    onClick={() => updateCount(drink.id, -1)}
                    disabled={quantity === 0}
                    aria-label={`Subtract one ${drink.name}`}
                  >
                    -
                  </button>
                  <input
                    className="quantity-input"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={quantity}
                    onChange={(event) => setCount(drink.id, event.target.value)}
                    aria-label={`${drink.name} quantity`}
                  />
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
            );
          })
        ) : (
          <p className="empty-state">No drinks match this view.</p>
        )}
      </section>
        </>
      ) : (
        <section className="closing-view" aria-label="Closing checklist">
          <section className="summary closing-summary" aria-label="Closing progress">
            <div>
              <span>{cleaningCompleted}/{cleaningTotal}</span>
              <p>Tasks done</p>
            </div>
            <div>
              <span>{CLEANING_SECTIONS.length}</span>
              <p>Areas</p>
            </div>
          </section>

          <section className="closing-list" aria-label="Cleaning areas">
            {CLEANING_SECTIONS.map((section) => {
              const completedInSection = section.items.filter((item, index) =>
                cleaningDone[makeCleaningId(section.title, item, index)]
              ).length;

              return (
                <article className="cleaning-section" key={section.title}>
                  <header>
                    <h2>{section.title}</h2>
                    <span>{completedInSection}/{section.items.length}</span>
                  </header>

                  <div className="cleaning-items">
                    {section.items.map((item, index) => {
                      const id = makeCleaningId(section.title, item, index);
                      const isDone = Boolean(cleaningDone[id]);

                      return (
                        <button
                          type="button"
                          className={`cleaning-item ${isDone ? 'is-done' : ''}`}
                          key={id}
                          onClick={() =>
                            toggleCleaningItem(section.title, item, index)
                          }
                          aria-pressed={isDone}
                        >
                          <span aria-hidden="true">{isDone ? 'X' : ''}</span>
                          <strong>{item}</strong>
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

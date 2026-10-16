
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Wallet, TrendingUp, TrendingDown, Plus, History,
  ChartNoAxesColumn, Settings, ArrowUpRight, ArrowDownRight,
  X, Check, CircleDollarSign
} from 'lucide-react';
import './style.css';

const categories = {
  income: ['Зарплата', 'Подработка', 'Подарок', 'Инвестиции', 'Другое'],
  expense: ['Продукты', 'Транспорт', 'Дом', 'Кафе', 'Покупки', 'Здоровье', 'Развлечения', 'Другое']
};

function App() {
  const [tab, setTab] = useState('home');
  
const [transactions, setTransactions] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('my-wallet-transactions') || '[]');
  } catch {
    return [];
  }
});

useEffect(() => {
  localStorage.setItem(
    'my-wallet-transactions',
    JSON.stringify(transactions)
  );
}, [transactions]);

  const [modal, setModal] = useState('');
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Продукты');
  const [description, setDescription] = useState('');

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    tg?.ready();
    tg?.expand();
  }, []);

  const money = value => new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: 2
  }).format(value);

  const balance = transactions.reduce((sum, t) =>
    sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  const month = transactions.filter(t => {
    const d = new Date(t.createdAt * 1000);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  });

  const income = month.filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expenses = month.filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  function openForm(kind) {
    setType(kind);
    setCategory(categories[kind][0]);
    setAmount('');
    setDescription('');
    setModal('transaction');
  }

  function saveTransaction(e) {
    e.preventDefault();
    const value = Number(amount.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) return;
    const item = {
      id: Date.now(),
      type,
      amount: Math.round(value * 100) / 100,
      category,
      description: description.trim(),
      createdAt: Math.floor(Date.now() / 1000)
    };
    setTransactions(prev => [item, ...prev]);
    setModal('');
  }

  const recent = [...transactions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Wallet size={23} /></div>
          <div><strong>Мой кошелёк</strong><small>Личные финансы</small></div>
        </div>
        <button className="round-btn" onClick={() => setTab('settings')} aria-label="Настройки">
          <Settings size={20} />
        </button>
      </header>

      {tab === 'home' && <main>
        <section className="balance-card">
          <div className="balance-heading"><span>Общий баланс</span><CircleDollarSign size={21} /></div>
          <h1>{money(balance)}</h1>
          <div className="balance-caption">Все ваши доходы и расходы</div>
          <div className="balance-actions">
            <button onClick={() => openForm('income')}><TrendingUp size={18} /> Доход</button>
            <button onClick={() => openForm('expense')}><TrendingDown size={18} /> Расход</button>
          </div>
        </section>

        <section className="stats">
          <article className="stat-card income-card">
            <div className="stat-icon"><ArrowDownRight size={19} /></div>
            <span>Доходы за месяц</span>
            <strong>{money(income)}</strong>
          </article>
          <article className="stat-card expense-card">
            <div className="stat-icon"><ArrowUpRight size={19} /></div>
            <span>Расходы за месяц</span>
            <strong>{money(expenses)}</strong>
          </article>
        </section>

        <section className="section">
          <div className="section-title"><h2>Последние операции</h2>
            <button className="text-btn" onClick={() => setTab('history')}>Все <ArrowUpRight size={15} /></button>
          </div>
          {recent.length === 0 ? <div className="empty">
            <div className="empty-icon"><History size={27} /></div>
            <strong>Пока нет операций</strong>
            <p>Добавьте первый доход или расход, чтобы начать вести учёт.</p>
          </div> : recent.slice(0, 5).map(t => <Transaction key={t.id} t={t} money={money} />)}
        </section>
      </main>}

      {tab === 'history' && <main className="section page-section">
        <h2>История операций</h2>
        {recent.length === 0 ? <div className="empty"><History size={28} /><p>Операций пока нет</p></div> :
          recent.map(t => <Transaction key={t.id} t={t} money={money} />)}
      </main>}

      {tab === 'stats' && <main className="section page-section">
        <h2>Статистика</h2>
        <div className="stats">
          <article className="stat-card income-card"><span>Доходы за месяц</span><strong>{money(income)}</strong></article>
          <article className="stat-card expense-card"><span>Расходы за месяц</span><strong>{money(expenses)}</strong></article>
        </div>
        <div className="empty"><ChartNoAxesColumn size={28} /><p>Подробная аналитика появится по мере накопления операций.</p></div>
      </main>}

      {tab === 'settings' && <main className="section page-section">
        <h2>Настройки</h2>
        <div className="setting-row"><span>Приложение</span><strong>Мой кошелёк</strong></div>
        <div className="setting-row"><span>Валюта</span><strong>Российский рубль (₽)</strong></div>
        <p className="hint">Сейчас операции хранятся только в памяти открытой страницы. Подключим сохранение в базу данных на следующем этапе.</p>
      </main>}

      {modal === 'transaction' && <div className="overlay" onClick={() => setModal('')}>
        <form className="modal" onSubmit={saveTransaction} onClick={e => e.stopPropagation()}>
          <div className="modal-heading"><h2>{type === 'income' ? 'Новый доход' : 'Новый расход'}</h2>
            <button type="button" className="round-btn" onClick={() => setModal('')}><X size={20} /></button>
          </div>
          <div className="type-switch">
            <button type="button" className={type === 'income' ? 'selected income-selected' : ''} onClick={() => {setType('income');setCategory(categories.income[0]);}}>Доход</button>
            <button type="button" className={type === 'expense' ? 'selected expense-selected' : ''} onClick={() => {setType('expense');setCategory(categories.expense[0]);}}>Расход</button>
          </div>
          <label>Сумма, ₽<input autoFocus inputMode="decimal" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} required /></label>
          <label>Категория<select value={category} onChange={e => setCategory(e.target.value)}>{categories[type].map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Комментарий <input placeholder="Например, покупки на неделю" value={description} onChange={e => setDescription(e.target.value)} /></label>
          <button className="submit-btn" type="submit"><Check size={18} /> Сохранить операцию</button>
        </form>
      </div>}

      <nav className="bottom-nav">
        <NavItem icon={<Wallet size={20} />} label="Главная" active={tab === 'home'} onClick={() => setTab('home')} />
        <NavItem icon={<History size={20} />} label="История" active={tab === 'history'} onClick={() => setTab('history')} />
        <NavItem icon={<ChartNoAxesColumn size={20} />} label="Статистика" active={tab === 'stats'} onClick={() => setTab('stats')} />
        <NavItem icon={<Settings size={20} />} label="Настройки" active={tab === 'settings'} onClick={() => setTab('settings')} />
      </nav>
    </div>
  );
}

function Transaction({ t, money }) {
  return <div className="transaction">
    <div className={'transaction-icon ' + t.type}>
      {t.type === 'income' ? <TrendingUp size={19} /> : <TrendingDown size={19} />}
    </div>
    <div className="transaction-info"><strong>{t.category}</strong>
      <span>{t.description || new Date(t.createdAt * 1000).toLocaleDateString('ru-RU')}</span>
    </div>
    <strong className={'transaction-amount ' + t.type}>
      {t.type === 'income' ? '+' : '−'}{money(t.amount)}
    </strong>
  </div>;
}

function NavItem({ icon, label, active, onClick }) {
  return <button className={'nav-item ' + (active ? 'active' : '')} onClick={onClick}>
    {icon}<span>{label}</span>
  </button>;
}

createRoot(document.getElementById('root')).render(<App />);

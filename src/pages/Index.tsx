import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Section = "news" | "units" | "brigades" | "commanders" | "analytics" | "settings";

interface NewsItem {
  id: number;
  source: "telegram" | "facebook";
  channel: string;
  text: string;
  time: string;
  urgent?: boolean;
  views?: number;
}

interface Unit {
  id: number;
  name: string;
  code: string;
  type: string;
  status: "active" | "alert" | "critical";
  strength: number;
  maxStrength: number;
  location: string;
  commander: string;
}

interface Brigade {
  id: number;
  name: string;
  number: string;
  status: "active" | "alert" | "critical";
  unitsCount: number;
  location: string;
  formed: string;
}

interface Commander {
  id: number;
  name: string;
  rank: string;
  unit: string;
  status: "active" | "alert";
  since: string;
  awards: number;
}

const mockNews: NewsItem[] = [
  { id: 1, source: "telegram", channel: "Оперативный канал", text: "Подразделения 3-й бригады успешно отразили атаку на направлении Покровск, уничтожено 4 единицы бронетехники противника.", time: "14:32", urgent: true, views: 12400 },
  { id: 2, source: "facebook", channel: "Официальная страница", text: "Противник произвёл 87 обстрелов по 12 населённым пунктам. Силы обороны ответили контрбатарейным огнём.", time: "14:15", views: 45200 },
  { id: 3, source: "telegram", channel: "Военный канал", text: "Авиация уничтожила огневую позицию противника в районе Херсона. Подтверждена ликвидация ЗРК.", time: "13:58", views: 8900 },
  { id: 4, source: "telegram", channel: "Оперативный канал", text: "На Харьковском направлении зафиксировано перемещение колонны техники противника. Задействованы ударные дроны.", time: "13:44", views: 21300 },
  { id: 5, source: "facebook", channel: "Пресс-служба", text: "Подписан контракт на поставку новых систем противовоздушной обороны. Поступление ожидается до конца месяца.", time: "13:20", views: 67100 },
  { id: 6, source: "telegram", channel: "Военный канал", text: "Разведка подтвердила концентрацию сил противника к востоку от Курахово. Командование принимает меры.", time: "12:55", urgent: true, views: 15600 },
  { id: 7, source: "facebook", channel: "Официальная страница", text: "Штаб оперативного командования провёл совещание с командирами бригад. Согласованы планы на ближайшую неделю.", time: "12:30", views: 33800 },
];

const mockUnits: Unit[] = [
  { id: 1, name: "1-й батальон", code: "1БТГ-001", type: "Пехота", status: "active", strength: 487, maxStrength: 500, location: "Запорожская обл.", commander: "полк. Петренко В.А." },
  { id: 2, name: "2-й батальон", code: "2БТГ-002", type: "Механизированный", status: "active", strength: 423, maxStrength: 500, location: "Херсонская обл.", commander: "майор Ковальчук Р.С." },
  { id: 3, name: "3-й батальон", code: "3БТГ-003", type: "Штурмовой", status: "alert", strength: 312, maxStrength: 500, location: "Донецкая обл.", commander: "подп. Мельник О.Д." },
  { id: 4, name: "4-й батальон", code: "4БТГ-004", type: "Разведка", status: "active", strength: 198, maxStrength: 250, location: "Харьковская обл.", commander: "кап. Бойко С.Н." },
  { id: 5, name: "5-й батальон", code: "5БТГ-005", type: "Артиллерия", status: "critical", strength: 145, maxStrength: 300, location: "Николаевская обл.", commander: "полк. Сидоренко И.В." },
  { id: 6, name: "6-й батальон", code: "6БТГ-006", type: "ПВО", status: "active", strength: 276, maxStrength: 300, location: "Днепропетровская обл.", commander: "майор Гриценко А.Л." },
];

const mockBrigades: Brigade[] = [
  { id: 1, name: "1-я отдельная бригада", number: "1 ОБр", status: "active", unitsCount: 8, location: "Восток", formed: "2022" },
  { id: 2, name: "3-я штурмовая бригада", number: "3 ШБр", status: "active", unitsCount: 6, location: "Юг", formed: "2022" },
  { id: 3, name: "47-я отдельная бригада", number: "47 ОМБр", status: "alert", unitsCount: 5, location: "Запад", formed: "2023" },
  { id: 4, name: "92-я отдельная бригада", number: "92 ОМБр", status: "active", unitsCount: 7, location: "Север", formed: "2014" },
  { id: 5, name: "110-я бригада", number: "110 ОМБр", status: "critical", unitsCount: 4, location: "Донецк", formed: "2022" },
];

const mockCommanders: Commander[] = [
  { id: 1, name: "Петренко Валерий Алексеевич", rank: "Полковник", unit: "1 ОБр", status: "active", since: "2022", awards: 4 },
  { id: 2, name: "Ковальчук Роман Сергеевич", rank: "Майор", unit: "2 БТГ", status: "active", since: "2023", awards: 2 },
  { id: 3, name: "Мельник Олег Дмитриевич", rank: "Подполковник", unit: "3 ШБр", status: "alert", since: "2022", awards: 3 },
  { id: 4, name: "Бойко Степан Николаевич", rank: "Капитан", unit: "4 БТГ", status: "active", since: "2023", awards: 1 },
  { id: 5, name: "Сидоренко Иван Васильевич", rank: "Полковник", unit: "92 ОМБр", status: "active", since: "2014", awards: 6 },
];

const StatCard = ({ label, value, icon, color, delay }: {
  label: string; value: string | number; icon: string; color: string; delay: number;
}) => (
  <div className="mil-card rounded-lg p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-ibm uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
      <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: `${color}22` }}>
        <Icon name={icon} size={16} style={{ color }} />
      </div>
    </div>
    <div className="font-oswald text-3xl font-semibold" style={{ color }}>{value}</div>
  </div>
);

const LiveTicker = () => {
  const items = [
    "⚡ СРОЧНОЕ СООБЩЕНИЕ",
    "▸ 3-я штурмовая отразила атаку на Покровск",
    "▸ Авиация уничтожила 2 вертолёта противника",
    "▸ 47-я бригада получила подкрепление",
    "▸ Зафиксировано движение колонны на востоке",
    "▸ Переговоры по гуманитарным коридорам",
  ];
  return (
    <div className="relative h-8 overflow-hidden flex items-center" style={{ background: 'rgba(245,158,11,0.07)', borderTop: '1px solid rgba(245,158,11,0.18)', borderBottom: '1px solid rgba(245,158,11,0.18)' }}>
      <div className="px-3 py-1 text-xs font-oswald font-semibold tracking-widest shrink-0" style={{ background: 'rgba(245,158,11,0.9)', color: '#0a0f0b' }}>LIVE</div>
      <div className="overflow-hidden flex-1 ml-2">
        <div className="animate-ticker whitespace-nowrap text-xs font-ibm" style={{ color: 'var(--mil-amber)' }}>
          {[...items, ...items].join("   ·   ")}
        </div>
      </div>
      <div className="w-2 h-2 rounded-full shrink-0 mr-3 animate-pulse" style={{ background: 'var(--mil-amber)' }} />
    </div>
  );
};

const RadarWidget = () => (
  <div className="relative w-24 h-24 opacity-60">
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#4ade80" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#4ade80" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="#4ade80" strokeWidth="0.5" />
      <line x1="50" y1="5" x2="50" y2="95" stroke="#4ade80" strokeWidth="0.5" />
      <line x1="5" y1="50" x2="95" y2="50" stroke="#4ade80" strokeWidth="0.5" />
      <circle cx="35" cy="40" r="2" fill="#f59e0b" opacity="0.8" />
      <circle cx="65" cy="60" r="1.5" fill="#4ade80" opacity="0.8" />
      <circle cx="58" cy="32" r="2" fill="#ef4444" opacity="0.8" />
    </svg>
    <div className="absolute inset-0 animate-radar" style={{ transformOrigin: '50% 50%' }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M50,50 L50,5 A45,45 0 0,1 94,72 Z" fill="url(#rg)" />
      </svg>
    </div>
  </div>
);

// ─── News ─────────────────────────────────────────────────────────────────────
const NewsSection = () => {
  const [filter, setFilter] = useState<"all" | "telegram" | "facebook">("all");
  const filtered = filter === "all" ? mockNews : mockNews.filter(n => n.source === filter);

  return (
    <div className="animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-oswald text-2xl font-semibold tracking-wide" style={{ color: 'var(--mil-green)' }}>ЛЕНТА НОВОСТЕЙ</h2>
          <p className="text-xs font-ibm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Telegram + Facebook · Обновление в реальном времени</p>
        </div>
        <div className="flex items-center gap-2">
          {(["all", "telegram", "facebook"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded text-xs font-ibm font-medium transition-all" style={{
              background: filter === f ? (f === "telegram" ? "rgba(56,189,248,0.15)" : f === "facebook" ? "rgba(99,102,241,0.15)" : "rgba(74,222,128,0.15)") : "rgba(255,255,255,0.04)",
              color: filter === f ? (f === "telegram" ? "var(--mil-blue)" : f === "facebook" ? "#818cf8" : "var(--mil-green)") : "hsl(var(--muted-foreground))",
              border: `1px solid ${filter === f ? (f === "telegram" ? "rgba(56,189,248,0.3)" : f === "facebook" ? "rgba(99,102,241,0.3)" : "rgba(74,222,128,0.3)") : "var(--mil-border)"}`,
            }}>
              {f === "all" ? "Все" : f === "telegram" ? "Telegram" : "Facebook"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { name: "Оперативный канал", source: "telegram", subs: "247K" },
          { name: "Официальная страница", source: "facebook", subs: "891K" },
          { name: "Военный канал", source: "telegram", subs: "134K" },
          { name: "Пресс-служба", source: "facebook", subs: "1.2M" },
        ].map((ch, i) => (
          <div key={i} className="mil-card rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: ch.source === "telegram" ? "rgba(56,189,248,0.15)" : "rgba(99,102,241,0.15)" }}>
              <Icon name={ch.source === "telegram" ? "Send" : "Globe"} size={14} style={{ color: ch.source === "telegram" ? "var(--mil-blue)" : "#818cf8" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-ibm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{ch.name}</div>
              <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{ch.subs}</div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: 'var(--mil-green)' }} />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((item, i) => (
          <div key={item.id} className={`news-item ${item.source === "telegram" ? "tg" : "fb"} pl-4 py-3 pr-4 rounded-r-lg opacity-0 animate-fade-in-up`}
            style={{ background: item.urgent ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)", animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}>
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: item.source === "telegram" ? "rgba(56,189,248,0.15)" : "rgba(99,102,241,0.15)" }}>
                  <Icon name={item.source === "telegram" ? "Send" : "Globe"} size={10} style={{ color: item.source === "telegram" ? "var(--mil-blue)" : "#818cf8" }} />
                </div>
                <span className="text-xs font-ibm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.channel}</span>
                {item.urgent && <span className="px-1.5 py-0.5 rounded text-xs font-oswald tracking-wider status-alert">СРОЧНО</span>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {item.views && <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{(item.views / 1000).toFixed(1)}K</span>}
                <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.time}</span>
              </div>
            </div>
            <p className="text-sm font-ibm leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Units ────────────────────────────────────────────────────────────────────
const UnitsSection = () => {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-oswald text-2xl font-semibold tracking-wide" style={{ color: 'var(--mil-green)' }}>ПОДРАЗДЕЛЕНИЯ</h2>
          <p className="text-xs font-ibm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{mockUnits.length} активных подразделений</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded text-xs font-ibm font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--mil-green)', border: '1px solid rgba(74,222,128,0.3)' }}>
          <Icon name="Plus" size={14} /> Добавить подразделение
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {mockUnits.map((unit, i) => (
          <div key={unit.id} onClick={() => setSelected(selected === unit.id ? null : unit.id)}
            className="mil-card rounded-lg p-4 cursor-pointer opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards', border: selected === unit.id ? '1px solid rgba(74,222,128,0.4)' : undefined }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-oswald font-semibold tracking-wide" style={{ color: 'hsl(var(--foreground))' }}>{unit.name}</div>
                <div className="text-xs font-mono mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{unit.code}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-oswald tracking-wider ${unit.status === "active" ? "status-active" : unit.status === "alert" ? "status-alert" : "status-critical"}`}>
                {unit.status === "active" ? "АКТИВЕН" : unit.status === "alert" ? "ВНИМАНИЕ" : "КРИТИЧНО"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-ibm">
              <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Тип: </span><span style={{ color: 'hsl(var(--foreground))' }}>{unit.type}</span></div>
              <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Локация: </span><span style={{ color: 'hsl(var(--foreground))' }}>{unit.location}</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-ibm" style={{ color: 'hsl(var(--muted-foreground))' }}>Личный состав</span>
                <span className="font-mono" style={{ color: unit.status === "critical" ? "var(--mil-red)" : unit.status === "alert" ? "var(--mil-amber)" : "var(--mil-green)" }}>
                  {unit.strength}/{unit.maxStrength}
                </span>
              </div>
              <div className="mil-progress">
                <div className="mil-progress-fill" style={{
                  width: `${(unit.strength / unit.maxStrength) * 100}%`,
                  background: unit.status === "critical" ? "linear-gradient(90deg,#ef4444,#f87171)" : unit.status === "alert" ? "linear-gradient(90deg,#f59e0b,#fcd34d)" : undefined,
                }} />
              </div>
            </div>
            {selected === unit.id && (
              <div className="mt-3 pt-3 text-xs font-ibm animate-fade-in" style={{ borderTop: '1px solid var(--mil-border)', color: 'hsl(var(--muted-foreground))' }}>
                Командир: <span style={{ color: 'var(--mil-green)' }}>{unit.commander}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Brigades ─────────────────────────────────────────────────────────────────
const BrigadesSection = () => (
  <div className="animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-oswald text-2xl font-semibold tracking-wide" style={{ color: 'var(--mil-green)' }}>БРИГАДЫ</h2>
        <p className="text-xs font-ibm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{mockBrigades.length} бригад на учёте</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 rounded text-xs font-ibm font-medium transition-all hover:opacity-90"
        style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--mil-green)', border: '1px solid rgba(74,222,128,0.3)' }}>
        <Icon name="Plus" size={14} /> Добавить бригаду
      </button>
    </div>
    <div className="space-y-3">
      {mockBrigades.map((brigade, i) => (
        <div key={brigade.id} className="mil-card rounded-lg p-5 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 font-oswald font-bold text-sm"
                style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--mil-green)', border: '1px solid rgba(74,222,128,0.2)' }}>
                {brigade.number.split(" ")[0]}
              </div>
              <div>
                <div className="font-oswald font-semibold tracking-wide" style={{ color: 'hsl(var(--foreground))' }}>{brigade.name}</div>
                <div className="flex items-center gap-3 mt-1 text-xs font-ibm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span className="flex items-center gap-1"><Icon name="MapPin" size={10} />{brigade.location}</span>
                  <span className="flex items-center gap-1"><Icon name="Users" size={10} />{brigade.unitsCount} подразделений</span>
                  <span className="flex items-center gap-1"><Icon name="Calendar" size={10} />с {brigade.formed}</span>
                </div>
              </div>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-oswald tracking-wider ${brigade.status === "active" ? "status-active" : brigade.status === "alert" ? "status-alert" : "status-critical"}`}>
              {brigade.status === "active" ? "АКТИВНА" : brigade.status === "alert" ? "ВНИМАНИЕ" : "КРИТИЧНО"}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Commanders ───────────────────────────────────────────────────────────────
const CommandersSection = () => (
  <div className="animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-oswald text-2xl font-semibold tracking-wide" style={{ color: 'var(--mil-green)' }}>КОМАНДИРЫ</h2>
        <p className="text-xs font-ibm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Командный состав</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 rounded text-xs font-ibm font-medium transition-all hover:opacity-90"
        style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--mil-green)', border: '1px solid rgba(74,222,128,0.3)' }}>
        <Icon name="Plus" size={14} /> Добавить командира
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {mockCommanders.map((cmd, i) => (
        <div key={cmd.id} className="mil-card rounded-lg p-5 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-oswald font-bold text-lg"
              style={{ background: 'rgba(74,222,128,0.08)', color: 'var(--mil-green)', border: '2px solid rgba(74,222,128,0.2)' }}>
              {cmd.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-oswald font-medium text-sm tracking-wide" style={{ color: 'hsl(var(--foreground))' }}>{cmd.name}</div>
              <div className="text-xs font-ibm mt-0.5" style={{ color: 'var(--mil-amber)' }}>{cmd.rank}</div>
            </div>
            <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: cmd.status === "active" ? "var(--mil-green)" : "var(--mil-amber)" }} />
          </div>
          <div className="space-y-2 text-xs font-ibm">
            <div className="flex justify-between">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Подразделение</span>
              <span style={{ color: 'hsl(var(--foreground))' }}>{cmd.unit}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>В должности с</span>
              <span style={{ color: 'hsl(var(--foreground))' }}>{cmd.since}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Награды</span>
              <span className="flex items-center gap-1" style={{ color: 'var(--mil-amber)' }}>
                <Icon name="Star" size={10} />{cmd.awards}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Analytics ────────────────────────────────────────────────────────────────
const AnalyticsSection = () => {
  const bars = [
    { label: "Пн", value: 65, events: 12 }, { label: "Вт", value: 82, events: 19 },
    { label: "Ср", value: 48, events: 8 }, { label: "Чт", value: 91, events: 24 },
    { label: "Пт", value: 73, events: 16 }, { label: "Сб", value: 55, events: 9 },
    { label: "Вс", value: 88, events: 21 },
  ];
  return (
    <div className="animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="mb-6">
        <h2 className="font-oswald text-2xl font-semibold tracking-wide" style={{ color: 'var(--mil-green)' }}>АНАЛИТИКА</h2>
        <p className="text-xs font-ibm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Статистика за неделю</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="mil-card rounded-lg p-5">
          <h3 className="font-oswald text-sm font-medium tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Активность событий</h3>
          <div className="flex items-end gap-2 h-32">
            {bars.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-mono opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards', color: 'var(--mil-green)' }}>{bar.events}</span>
                <div className="w-full rounded-t opacity-0 animate-fade-in-up"
                  style={{ height: `${bar.value}%`, background: `linear-gradient(to top, rgba(74,222,128,0.8), rgba(74,222,128,0.3))`, animationDelay: `${i * 80}ms`, animationFillMode: 'forwards', minHeight: 4 }} />
                <span className="text-xs font-ibm" style={{ color: 'hsl(var(--muted-foreground))' }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mil-card rounded-lg p-5">
          <h3 className="font-oswald text-sm font-medium tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Источники новостей</h3>
          <div className="space-y-4 mb-6">
            {[{ label: "Telegram", percent: 68, color: "var(--mil-blue)" }, { label: "Facebook", percent: 32, color: "#818cf8" }].map((src, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-ibm mb-1.5">
                  <span style={{ color: 'hsl(var(--foreground))' }}>{src.label}</span>
                  <span style={{ color: src.color }}>{src.percent}%</span>
                </div>
                <div className="mil-progress"><div className="mil-progress-fill" style={{ width: `${src.percent}%`, background: src.color }} /></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: '1px solid var(--mil-border)' }}>
            {[{ label: "Новостей сегодня", value: "47", color: "var(--mil-green)" }, { label: "Срочных", value: "8", color: "var(--mil-amber)" }, { label: "Каналов", value: "12", color: "var(--mil-blue)" }].map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-oswald text-2xl font-semibold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs font-ibm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mil-card rounded-lg p-5 lg:col-span-2">
          <h3 className="font-oswald text-sm font-medium tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Состояние подразделений</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Активные", count: 4, total: 6, color: "var(--mil-green)", cls: "status-active" },
              { label: "Внимание", count: 1, total: 6, color: "var(--mil-amber)", cls: "status-alert" },
              { label: "Критично", count: 1, total: 6, color: "var(--mil-red)", cls: "status-critical" },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="font-oswald text-4xl font-bold mb-1" style={{ color: item.color }}>{item.count}</div>
                <div className={`inline-block px-2 py-0.5 rounded text-xs font-oswald tracking-wider ${item.cls} mb-2`}>{item.label}</div>
                <div className="mil-progress mt-2"><div className="mil-progress-fill" style={{ width: `${(item.count / item.total) * 100}%`, background: item.color }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Settings ─────────────────────────────────────────────────────────────────
const SettingsSection = () => {
  const [tgToken, setTgToken] = useState("");
  const [fbToken, setFbToken] = useState("");
  return (
    <div className="animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <div className="mb-6">
        <h2 className="font-oswald text-2xl font-semibold tracking-wide" style={{ color: 'var(--mil-green)' }}>НАСТРОЙКИ</h2>
        <p className="text-xs font-ibm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Интеграции и конфигурация</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: "Telegram", icon: "Send", color: "var(--mil-blue)", bg: "rgba(56,189,248,0.15)", border: "rgba(56,189,248,0.2)", channels: ["@operativniy_kanal", "@voenniy_kanal"], val: tgToken, set: setTgToken },
          { title: "Facebook", icon: "Globe", color: "#818cf8", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.2)", channels: ["Официальная страница", "Пресс-служба"], val: fbToken, set: setFbToken },
        ].map((int, i) => (
          <div key={i} className="mil-card rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: int.bg, border: `1px solid ${int.border}` }}>
                <Icon name={int.icon} size={18} style={{ color: int.color }} />
              </div>
              <div>
                <h3 className="font-oswald font-semibold tracking-wide" style={{ color: 'hsl(var(--foreground))' }}>{int.title}</h3>
                <span className="text-xs status-active px-1.5 py-0.5 rounded">АКТИВЕН</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-ibm mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Access Token</label>
                <input type="password" placeholder="••••••••••••••••" value={int.val} onChange={e => int.set(e.target.value)}
                  className="w-full px-3 py-2 rounded text-sm font-mono"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--mil-border)', color: 'hsl(var(--foreground))', outline: 'none' }} />
              </div>
              <div>
                <label className="block text-xs font-ibm mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Подключённые каналы</label>
                {int.channels.map((ch, j) => (
                  <div key={j} className="flex items-center justify-between py-2 text-xs font-ibm" style={{ borderBottom: '1px solid var(--mil-border)' }}>
                    <span style={{ color: int.color }}>{ch}</span>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--mil-green)' }} />
                  </div>
                ))}
              </div>
              <button className="w-full py-2 rounded text-xs font-ibm font-medium transition-all hover:opacity-90"
                style={{ background: int.bg, color: int.color, border: `1px solid ${int.border}` }}>
                + Добавить канал
              </button>
            </div>
          </div>
        ))}
        <div className="mil-card rounded-lg p-5 lg:col-span-2">
          <h3 className="font-oswald text-sm font-medium tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Системная информация</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Версия системы", value: "v1.0.0", icon: "Cpu" },
              { label: "Последнее обновление", value: "11.06.2026", icon: "RefreshCw" },
              { label: "Статус БД", value: "Online", icon: "Database" },
              { label: "API запросов/час", value: "1 247", icon: "Activity" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Icon name={item.icon} size={16} style={{ color: 'var(--mil-green)' }} />
                <div>
                  <div className="text-xs font-ibm" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.label}</div>
                  <div className="text-sm font-mono font-medium" style={{ color: 'hsl(var(--foreground))' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Nav ──────────────────────────────────────────────────────────────────────
const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "news", label: "Новости", icon: "Rss" },
  { id: "units", label: "Подразделения", icon: "Shield" },
  { id: "brigades", label: "Бригады", icon: "Flag" },
  { id: "commanders", label: "Командиры", icon: "Star" },
  { id: "analytics", label: "Аналитика", icon: "BarChart2" },
  { id: "settings", label: "Настройки", icon: "Settings" },
];

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [section, setSection] = useState<Section>("news");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [time, setTime] = useState(new Date());
  const [newsCount, setNewsCount] = useState(47);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNewsCount(c => c + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const renderSection = () => {
    switch (section) {
      case "news": return <NewsSection />;
      case "units": return <UnitsSection />;
      case "brigades": return <BrigadesSection />;
      case "commanders": return <CommandersSection />;
      case "analytics": return <AnalyticsSection />;
      case "settings": return <SettingsSection />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden grid-overlay" style={{ background: 'var(--mil-bg)' }}>

      {/* Sidebar */}
      <aside className="flex flex-col shrink-0 relative z-20 animate-slide-in-left"
        style={{ width: sidebarOpen ? 220 : 60, background: 'var(--mil-surface)', borderRight: '1px solid var(--mil-border)', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }}>

        <div className="flex items-center gap-3 px-3 py-4" style={{ borderBottom: '1px solid var(--mil-border)', minHeight: 60 }}>
          <div className="w-9 h-9 rounded flex items-center justify-center shrink-0 glow-green"
            style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)' }}>
            <Icon name="Shield" size={18} style={{ color: 'var(--mil-green)' }} />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in overflow-hidden">
              <div className="font-oswald font-bold text-sm tracking-widest text-glow-green" style={{ color: 'var(--mil-green)' }}>MIL DASH</div>
              <div className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>v1.0</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`nav-item w-full flex items-center gap-3 px-3 py-3 ${section === item.id ? "active" : ""}`}
              style={{ color: section === item.id ? 'var(--mil-green)' : 'hsl(var(--muted-foreground))' }}>
              <Icon name={item.icon} size={18} className="shrink-0" />
              {sidebarOpen && <span className="text-sm font-ibm font-medium tracking-wide animate-fade-in">{item.label}</span>}
              {item.id === "news" && sidebarOpen && (
                <span className="ml-auto text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--mil-green)', border: '1px solid rgba(74,222,128,0.2)' }}>
                  {newsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid var(--mil-border)' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center py-2 rounded transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'hsl(var(--muted-foreground))' }}>
            <Icon name={sidebarOpen ? "ChevronLeft" : "ChevronRight"} size={16} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="shrink-0 flex items-center justify-between px-6"
          style={{ height: 60, background: 'var(--mil-surface)', borderBottom: '1px solid var(--mil-border)' }}>
          <div className="flex items-center gap-4">
            <span className="font-oswald text-lg font-semibold tracking-wide" style={{ color: 'hsl(var(--foreground))' }}>
              {navItems.find(n => n.id === section)?.label.toUpperCase()}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--mil-green)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--mil-green)' }}>ОНЛАЙН</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RadarWidget />
            <div className="text-right">
              <div className="font-mono text-xl font-bold" style={{ color: 'var(--mil-green)' }}>
                {time.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="text-xs font-ibm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {time.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </header>

        <LiveTicker />

        <div className="shrink-0 grid grid-cols-4 gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--mil-border)' }}>
          <StatCard label="Подразделений" value={mockUnits.length} icon="Shield" color="var(--mil-green)" delay={0} />
          <StatCard label="Бригад" value={mockBrigades.length} icon="Flag" color="var(--mil-blue)" delay={100} />
          <StatCard label="Командиров" value={mockCommanders.length} icon="Star" color="var(--mil-amber)" delay={200} />
          <StatCard label="Новостей сегодня" value={newsCount} icon="Rss" color="#818cf8" delay={300} />
        </div>

        <main className="flex-1 overflow-y-auto px-6 py-6" key={section}>
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

import { useTheme } from '../context/ThemeContext'

export default function ThemeSwitcher() {
  const { theme, themes, setTheme } = useTheme()

  return (
    <div className="theme-switcher">
      {themes.map((t) => (
        <button
          key={t.id}
          className={`theme-btn ${theme.id === t.id ? 'active' : ''}`}
          onClick={() => setTheme(t)}
          title={t.name}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

# ProTrack — Advanced To-Do + Fitness Tracker

A fully functional, production-quality single-page web application built with pure HTML, CSS, and Vanilla JavaScript.

## 🚀 Features

### Authentication
- 2 hardcoded users: `user1/pass1` and `user2/pass2`
- Session persists via localStorage across page refreshes
- Separate data namespaces for each user

### To-Do List
- Add / Edit / Delete tasks with full details
- Priority levels (High/Medium/Low) — color-coded
- Kanban board (Pending → In Progress → Completed) with drag & drop
- Filter & Sort by priority, category, status, due date
- Search bar
- Subtasks/checklist inside tasks
- Recurring tasks (daily/weekly)
- Overdue task highlighting
- Progress tracking

### Fitness Tracker
- Log daily steps, workout minutes, type, notes
- Goal setup (step goal + workout goal)
- Daily vs yesterday comparison with trend indicators
- Streak counters (step streak + workout streak)
- 14-day line/bar charts (Chart.js)
- Full activity history table

### Reports
- **Weekly Report**: This week vs last week comparison, best/worst day, goal achievement rate
- **Monthly Report**: Full month breakdown with charts

### Dashboard
- Quick stats cards
- Goal progress bars
- Activity heatmap (GitHub-style, last 12 weeks)
- Motivational daily quote

### Settings
- Custom task categories
- Daily goal configuration
- Export/Import JSON backup
- Browser notifications

## 🛠️ Tech Stack
- HTML5, CSS3, Vanilla JavaScript (ES6+)
- Chart.js (CDN) for data visualization
- Font Awesome (CDN) for icons
- localStorage for all data persistence

## 📦 Deployment

Deploy as a static site on **Vercel**, Netlify, or GitHub Pages:

```bash
# Just upload the 3 files:
index.html
style.css
script.js
```

No build step, no dependencies to install.

## ⚠️ Data Note
localStorage is browser/device-specific. Use **Export Data** regularly to backup your data.

## 👤 Default Users
| Username | Password | Display Name |
|----------|----------|--------------|
| user1 | pass1 | Alex Johnson |
| user2 | pass2 | Sam Rivera |

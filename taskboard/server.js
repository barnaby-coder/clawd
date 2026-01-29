const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3456;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(__dirname));

// Initialize data file if it doesn't exist
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      projects: [
        { id: 'proj-1', name: 'Agentic AI Research', color: '#3b82f6' },
        { id: 'proj-2', name: 'Side Hustle', color: '#10b981' }
      ],
      tasks: [
        { id: 't1', projectId: 'proj-1', title: 'Learn Clawdbot capabilities', status: 'done', created: new Date().toISOString() },
        { id: 't2', projectId: 'proj-1', title: 'Set up browser automation', status: 'done', created: new Date().toISOString() },
        { id: 't3', projectId: 'proj-1', title: 'Research agentic AI landscape', status: 'backlog', created: new Date().toISOString() },
        { id: 't4', projectId: 'proj-2', title: 'Define side hustle direction', status: 'in-progress', created: new Date().toISOString() }
      ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Routes
app.get('/api/data', (req, res) => {
  res.json(loadData());
});

app.post('/api/projects', (req, res) => {
  const data = loadData();
  const project = {
    id: 'proj-' + Date.now(),
    name: req.body.name,
    color: req.body.color || '#6b7280'
  };
  data.projects.push(project);
  saveData(data);
  res.json(project);
});

app.delete('/api/projects/:id', (req, res) => {
  const data = loadData();
  data.projects = data.projects.filter(p => p.id !== req.params.id);
  data.tasks = data.tasks.filter(t => t.projectId !== req.params.id);
  saveData(data);
  res.json({ ok: true });
});

app.post('/api/tasks', (req, res) => {
  const data = loadData();
  const task = {
    id: 't-' + Date.now(),
    projectId: req.body.projectId,
    title: req.body.title,
    description: req.body.description || '',
    status: 'backlog',
    created: new Date().toISOString()
  };
  data.tasks.push(task);
  saveData(data);
  res.json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const data = loadData();
  const task = data.tasks.find(t => t.id === req.params.id);
  if (task) {
    Object.assign(task, req.body);
    task.updated = new Date().toISOString();
    saveData(data);
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  const data = loadData();
  data.tasks = data.tasks.filter(t => t.id !== req.params.id);
  saveData(data);
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 Taskboard running at http://localhost:${PORT}`);
  console.log(`   Data stored in: ${DATA_FILE}`);
});

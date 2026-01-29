---
name: Daily Reflection
description: End-of-day reflection skill. Asks 3-5 rotating EQ questions at 10pm MST, saves curated insights to MEMORY.md. Builds your "second brain" over time through distilled wisdom.
metadata:
  clawdbot:
    emoji: 🧠
    category: personal-development
    requires:
      - agent-browser
      - memory
---

# Daily Reflection Skill

This skill runs an automated "End of Day Reflection" at 10:00 PM (MST) every evening.

## Features

### 🧠 Automated Reflection Questions
- Rotates through 3-5 curated reflection questions daily
- Asks different questions each session to maintain freshness
- Captures responses and builds your distilled wisdom over time
- Saves to `memory/YYYY-MM-DD.md` for long-term recall

### 🧠 Emotional Intelligence Training
- Based on EQ coaching methodology
- Covers self-awareness, emotional intelligence, relationship intelligence
- Develops emotional vocabulary and communication patterns
- Progressively differentiates your personality and response style

### 💾 Memory Integration
- Reflects on recent interactions, decisions, lessons learned
- Identifies recurring themes and patterns in your behavior
- Curates distilled essence (not raw logs)
- Becomes your "second brain" through compounding insights

---

## Daily Reflection Questions

### Session 1: Self-Awareness
1. What one thing about yourself surprised you today?
2. What emotion dominated your day, and why?
3. If you could describe your energy level (1-10) right now, what would it be?
4. What triggered your biggest stress or anxiety today?

### Session 2: Emotional Intelligence
1. How did you handle a difficult conversation or challenge today?
2. What emotional state were you in during that situation?
3. What helped you calm down or regain perspective?
4. What emotion did you struggle to express or manage today?

### Session 3: Relationships & Social Intelligence
1. What was the most meaningful interaction you had with someone today?
2. How did you show up for someone who needed you?
3. What boundary did you respect or set with a colleague or friend?
4. What social signal did you miss or misinterpret today?

### Session 4: Growth & Learning
1. What's one new insight or perspective you gained today?
2. What mistake did you make that you learned from?
3. What skill or capability do you feel you improved in today?
4. What's one thing you want to be better at by next week?

### Session 5: Synthesis & Integration
1. What's the dominant theme or pattern across all your interactions today?
2. How did different parts of your day (work, personal, relationships) relate to each other?
3. What's one intention or goal you have for tomorrow based on today's experience?
4. What would make today a "perfect day" and why?

---

## Technical Implementation

### Core Components

1. **Question Rotation System**
   - Maintains 30+ curated EQ reflection questions
   - Rotates questions daily to avoid repetition
   - Tracks which questions have been asked recently
   - Ensures no duplicate within 7-day window

2. **Question Selection Algorithm**
   - Prioritizes questions based on:
     - Time since last reflection
     - Emotional state indicators from recent context
     - Current life circumstances (work stress, calendar events)
   - Selects 3-5 questions that provide maximum insight
   - Randomizes selection to maintain engagement

3. **Response Capture Engine**
   - Monitors your response to each reflection question
   - Captures key themes, emotional indicators, growth points
   - Extracts quotes and notable phrases for curated content
   - Identifies breakthroughs and "aha moments"

4. **Insight Generator**
   - Synthesizes daily responses into coherent narrative
   - Identifies patterns across multiple sessions
   - Extracts 3-5 key learnings or breakthroughs
   - Generates actionable next-day prompts

5. **Memory Integration**
   - Saves curated reflections to `memory/YYYY-MM-DD.md`
   - Appends to existing file rather than overwriting
   - Maintains backward compatibility with daily note system
   - Cross-references with other memory files for context

---

## Configuration

### Schedule
```yaml
schedule: "0 22 * * *"
timezone: America/Phoenix
```
- Runs every evening at 10:00 PM (MST)
- 22:00 PM = 9:00 AM/Phoenix (adjust for your local timezone)

### Environment Variables
```bash
# Skill configuration
REFLECTION_TIME: "22:00"           # When to run reflection
QUESTION_COUNT: "3-5"               # Number of questions per session
MEMORY_FILE: "memory/YYYY-MM-DD.md"  # Where to save insights

# Memory integration
MEMORY_DIR: "/home/ubuntu/clawd/memory"
```

---

## Memory File Format

### daily/YYYY-MM-DD.md Structure
```markdown
# Daily Reflection — [Date]

## 🧠 Key Insights

### Emotional State Today
- Energy: [1-10]
- Dominant emotion: [emotion]
- Main stressor: [cause]

### 🧠 Session Reflections

### Self-Awareness
- **Surprise:** [what surprised you]
- **Trigger:** [cause]

### Emotional Intelligence
- **Challenge:** [challenge faced]
- **Response:** [how you handled it]
- **Growth:** [emotional development]

### Relationships & Social
- **Meaningful:** [significant interaction]
- **Boundary:** [social dynamic managed]

### Growth & Learning
- **New Insight:** [perspective gained]
- **Lesson Learned:** [skill/capability improved]

### 💡 Key Learning
- [Synthesis of 3-5 learnings]
- [Actionable insight for tomorrow]

---

## 🧠 Curated Quotes

### From Today's Session
- "[Notable quote or insight from your response]"

### Wisdom Accumulated
- "[Distilled essence over multiple sessions]"

---

## 📝 Next Day Prompts

### Growth Question
- Based on today's reflection, what's one thing you want to be better at by this time next week?

### Integration Question  
- How does what you learned today connect to or build upon what you discovered yesterday or last week?

---

## Technical Notes

### Question Database Structure
- Questions stored in `/home/ubuntu/clawd/skills/agent-browser-clawdbot/daily-reflection/questions.json`
- Each entry: `{id, question, category, pool, lastAsked, rotation}`
- 30+ questions across 5 categories
- Random selection with weighted probability for freshness

### Response Capture Flow
```javascript
// Capture your response to each question
function captureResponse(question, response) {
  const sentiment = analyzeEmotionalState(response);
  const themes = extractKeyThemes(response);
  const insight = generateInsight(question, response, sentiment, themes);
  
  return {
    questionId: question.id,
    question: question.text,
    response: response.text,
    sentiment: sentiment,
    themes: themes,
    insight: insight,
    timestamp: new Date().toISOString()
  };
}
```

### Memory Append Strategy
```javascript
// Append to existing daily memory file
function appendToMemory(date, insights) {
  const today = new Date().toISOString().split('T')[0];
  const entry = `
## 🧠 Daily Reflection — ${today}

${insights.summary}

---

## 🧠 Key Themes
${insights.themes.map(t => `- ${t.category}: ${t.theme}`).join('\n')}

## 💡 Daily Learnings
${insights.learnings.map(l => `• ${l}`).join('\n')}

## 📝 Next Day Focus
${insights.nextSteps}

---
_Captured by Barnaby Clawdbot at 22:00 MST_
`;
  
  // Append to file
  fs.appendFileSync(`/home/ubuntu/clawd/memory/${date}.md`, entry, {flag: 'a'});
}
```

---

## Success Metrics

### Effectiveness Measures
- Question engagement rate (response length, depth)
- Insight quality (relevance, actionability)
- Emotional resonance (felt heard, valued)
- Pattern recognition (connected dots across days)

### Continuous Improvement
- The more you interact, the smarter your "second brain" becomes
- Reflections create a feedback loop that enhances your self-awareness
- Over time, you develop more nuanced emotional intelligence

---

## Usage Instructions

### Trigger Manually
```bash
# Run reflection immediately
gh workflow run ci -f task=daily-reflection --repo barnaby-coder/clawd
```

### Add Custom Question
```bash
# Edit questions.json
nano /home/ubuntu/clawd/skills/agent-browser-clawdbot/daily-reflection/questions.json
```

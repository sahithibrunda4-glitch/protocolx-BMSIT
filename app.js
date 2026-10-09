const $ = (id) => document.getElementById(id);
const chatInput = $('chatInput');
const charCount = $('charCount');
const analyzeBtn = $('analyzeBtn');
const exampleBtn = $('exampleBtn');
const emptyState = $('emptyState');
const results = $('results');
const summaryText = $('summaryText');
const importantCount = $('importantCount');
const taskCount = $('taskCount');
const importantList = $('importantList');
const taskList = $('taskList');
const priorityBox = $('priorityBox');
const copyBtn = $('copyBtn');
const resultStatus = $('resultStatus');
const errorMessage = $('errorMessage');

const sampleChat = `[09:12] Priya: Reminder, our project submission is due Friday at 5 PM.
[09:14] Arun: I'll finish the slides by tomorrow evening.
[09:15] Maya: Can someone share the meeting notes? I need them before today's meeting.
[09:18] Priya: Important: the professor changed the demo to Thursday at 10 AM.
[09:20] Arun: I can handle the demo setup. Please send me the final files by Wednesday.
[09:23] Maya: Don't forget we need everyone's approval before submitting.
[09:27] Priya: Action item: Maya, please check the references. Arun, test the demo.
[09:31] Arun: Got it. I'll send an update tonight.`;

const urgentWords = ['urgent', 'asap', 'immediately', 'important', 'today', 'tonight', 'tomorrow', 'deadline', 'due ', 'by friday', 'by monday', 'overdue', 'final reminder', 'changed to', 'rescheduled'];
const taskWords = ['i will', "i'll", 'please', 'need to', 'action item', 'follow up', 'remember to', 'don’t forget', "don't forget", 'deadline', 'send me', 'send the', 'finish', 'complete', 'submit', 'prepare', 'check ', 'review', 'test the', 'share the', 'reply', 'confirm', 'approval', 'by tomorrow', 'by friday', 'by monday'];
const importantWords = ['important', 'decision', 'agreed', 'confirmed', 'changed', 'rescheduled', 'meeting', 'deadline', 'due ', 'submit', 'submission', 'approval', 'cancelled', 'canceled', 'update', 'action item', 'final files', 'exam', 'interview'];

function normalizeLine(line) { return line.replace(/^\s*(\[[^\]]+\]\s*)?/, '').trim(); }
function splitMessages(text) {
  return text.split(/\n+|(?<=\.)\s+(?=[A-Z][a-z]+\s*:)/).map(normalizeLine).filter(line => line.length > 8);
}
function includesAny(text, words) { const lower = text.toLowerCase(); return words.some(word => lower.includes(word)); }
function uniqueLines(lines, limit = 5) {
  const seen = new Set();
  return lines.filter(line => { const key = line.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, limit);
}
function createItem(text, tag) {
  const li = document.createElement('li'); li.className = 'message-item';
  const label = document.createElement('span'); label.className = 'tag'; label.textContent = tag;
  const body = document.createElement('div'); body.textContent = text;
  li.append(label, body); return li;
}
function renderList(target, lines, tag, emptyText) {
  target.replaceChildren();
  if (!lines.length) { const li = document.createElement('li'); li.className = 'no-items'; li.textContent = emptyText; target.append(li); return; }
  lines.forEach(line => target.append(createItem(line, tag)));
}
function analyzeChat() {
  const text = chatInput.value.trim();
  if (!text) { errorMessage.hidden = false; chatInput.focus(); return; }
  errorMessage.hidden = true;
  const lines = splitMessages(text);
  const important = uniqueLines(lines.filter(line => includesAny(line, importantWords)), 5);
  const tasks = uniqueLines(lines.filter(line => includesAny(line, taskWords)), 6);
  const urgent = uniqueLines(lines.filter(line => includesAny(line, urgentWords)), 4);
  const summary = uniqueLines((important.length ? important : lines).slice(0, 4), 4);

  summaryText.replaceChildren();
  summary.forEach(line => { const li = document.createElement('li'); li.textContent = line; summaryText.append(li); });
  importantCount.textContent = String(important.length);
  taskCount.textContent = String(tasks.length);
  renderList(importantList, important, 'KEY MESSAGE', 'No clear key messages found. Review the conversation for context.');
  renderList(taskList, tasks, 'POSSIBLE ACTION', 'No obvious action items found.');
  priorityBox.replaceChildren();
  if (urgent.length) {
    const ul = document.createElement('ul'); urgent.forEach(line => { const li = document.createElement('li'); li.textContent = line; ul.append(li); }); priorityBox.append(ul);
  } else {
    const p = document.createElement('p'); p.textContent = 'No obvious urgency keywords detected. This does not guarantee there are no deadlines.'; priorityBox.append(p);
  }
  emptyState.hidden = true; results.hidden = false; resultStatus.textContent = 'ANALYSIS READY'; resultStatus.classList.add('ready');
  $('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

chatInput.addEventListener('input', () => {
  charCount.textContent = `${chatInput.value.length.toLocaleString()} / 20,000 characters`;
  errorMessage.hidden = true;
});
exampleBtn.addEventListener('click', () => { chatInput.value = sampleChat; chatInput.dispatchEvent(new Event('input')); chatInput.focus(); });
analyzeBtn.addEventListener('click', analyzeChat);
copyBtn.addEventListener('click', async () => {
  const sections = ['WHAT DID I MISS?','QUICK SUMMARY', ...Array.from(summaryText.children).map(li => '• ' + li.textContent), '', 'IMPORTANT MESSAGES', ...Array.from(importantList.querySelectorAll('.message-item')).map(li => li.innerText.replace('\n', ': ')), '', 'POSSIBLE ACTION ITEMS', ...Array.from(taskList.querySelectorAll('.message-item')).map(li => li.innerText.replace('\n', ': ')), '', 'Note: Keyword-based suggestions; check the original chat for context.'];
  const text = sections.join('\n');
  try { await navigator.clipboard.writeText(text); copyBtn.textContent = 'Copied ✓'; setTimeout(() => { copyBtn.textContent = 'Copy catch-up summary'; }, 1800); }
  catch { const area = document.createElement('textarea'); area.value = text; document.body.append(area); area.select(); const copied = document.execCommand('copy'); area.remove(); copyBtn.textContent = copied ? 'Copied ✓' : 'Select and copy manually'; }
});

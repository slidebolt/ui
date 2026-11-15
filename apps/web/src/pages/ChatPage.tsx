import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageSquare, RotateCcw, Send, Square, User } from 'lucide-react';
import { coreCommand } from '../lib/core';
import { type Entity, useEntities } from '../store/entityStore';

type ChatMessage = { id: string; role: 'user' | 'assistant' | 'error'; text: string };
type Pending = { key: string; beforeSeq: number };

export function chatAgents(entities: Entity[]) {
  return entities
    .filter(entity => entity.data.type === 'agent' && entity.data.commands?.includes('agent_prompt'))
    .sort((a, b) => `${a.data.name} ${a.key}`.localeCompare(`${b.data.name} ${b.key}`));
}

export function agentSnapshot(entity?: Entity) {
  const state = entity?.data.state ?? {};
  return {
    seq: typeof state.seq === 'number' ? state.seq : 0,
    status: typeof state.status === 'string' ? state.status : 'unknown',
    result: typeof state.result === 'string' ? state.result : '',
    error: typeof state.error === 'string' ? state.error : '',
  };
}

function newSession() {
  return `ui-${crypto.randomUUID()}`;
}

export default function ChatPage() {
  const entities = useEntities();
  const agents = useMemo(() => chatAgents(entities), [entities]);
  const [selectedKey, setSelectedKey] = useState('');
  const [draft, setDraft] = useState('');
  const [histories, setHistories] = useState<Record<string, ChatMessage[]>>({});
  const [sessions, setSessions] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Pending | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!agents.length) { setSelectedKey(''); return; }
    if (!agents.some(agent => agent.key === selectedKey)) setSelectedKey(agents[0].key);
  }, [agents, selectedKey]);

  const selected = agents.find(agent => agent.key === selectedKey);
  const snapshot = agentSnapshot(selected);
  const messages = selectedKey ? histories[selectedKey] ?? [] : [];
  const busy = sending || Boolean(pending && pending.key === selectedKey) || snapshot.status === 'thinking';

  useEffect(() => {
    if (!pending || !selected || pending.key !== selected.key) return;
    const current = agentSnapshot(selected);
    if (current.seq <= pending.beforeSeq || current.status === 'thinking') return;
    const text = current.error || current.result || 'The agent completed without a reply.';
    const role = current.error || current.status === 'error' ? 'error' : 'assistant';
    setHistories(value => ({ ...value, [selected.key]: [...(value[selected.key] ?? []), { id: crypto.randomUUID(), role, text }] }));
    setPending(null);
  }, [pending, selected]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, snapshot.status]);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!selected || !text || busy) return;
    const session = sessions[selected.key] ?? newSession();
    setSessions(value => ({ ...value, [selected.key]: session }));
    setHistories(value => ({ ...value, [selected.key]: [...(value[selected.key] ?? []), { id: crypto.randomUUID(), role: 'user', text }] }));
    setDraft('');
    setPending({ key: selected.key, beforeSeq: snapshot.seq });
    setSending(true);
    try {
      await coreCommand(selected.key, 'agent_prompt', { text, session });
    } catch (cause) {
      setPending(null);
      setHistories(value => ({ ...value, [selected.key]: [...(value[selected.key] ?? []), { id: crypto.randomUUID(), role: 'error', text: cause instanceof Error ? cause.message : 'Prompt failed' }] }));
    } finally { setSending(false); }
  };

  const cancel = async () => {
    if (!selected || !selected.data.commands?.includes('agent_cancel')) return;
    try { await coreCommand(selected.key, 'agent_cancel'); }
    catch (cause) { setHistories(value => ({ ...value, [selected.key]: [...(value[selected.key] ?? []), { id: crypto.randomUUID(), role: 'error', text: cause instanceof Error ? cause.message : 'Cancel failed' }] })); }
  };

  const reset = () => {
    if (!selected || busy) return;
    setSessions(value => ({ ...value, [selected.key]: newSession() }));
    setHistories(value => ({ ...value, [selected.key]: [] }));
    setDraft('');
  };

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); }
  };

  return <main className="chat-page">
    <header className="chat-header">
      <div className="summary-icon"><MessageSquare className="h-6 w-6" /></div>
      <div className="min-w-0 flex-1"><p className="section-kicker">Generic agent contract</p><h1>Agent chat</h1><p>Send the same prompts used by text, phone, and automations.</p></div>
      <label className="chat-agent-select"><span>Target</span><select value={selectedKey} onChange={event => setSelectedKey(event.target.value)} disabled={!agents.length || busy}>{agents.map(agent => <option key={agent.key} value={agent.key}>{agent.data.name || agent.data.id} · {agent.data.plugin}</option>)}</select></label>
    </header>

    {!selected ? <section className="chat-empty"><Bot className="h-10 w-10" /><h2>No agent entities available</h2><p>Configure an agent provider or an intent listener, then return here.</p></section> : <section className="chat-console">
      <header className="chat-console-header"><div><strong>{selected.data.name || selected.data.id}</strong><code>{selected.key}</code></div><div className="chat-actions"><span className={`chat-status chat-status-${snapshot.status}`}>{snapshot.status}</span><button className="secondary-button" onClick={reset} disabled={busy}><RotateCcw className="h-3.5 w-3.5" />New session</button></div></header>
      <div className="chat-messages" aria-live="polite">
        {!messages.length && <div className="chat-welcome"><Bot className="h-8 w-8" /><p>Ask this agent to inspect or control SlideBolt. Its tool calls and final state use the production contract.</p></div>}
        {messages.map(message => <article key={message.id} className={`chat-message chat-message-${message.role}`}><span>{message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</span><div><small>{message.role === 'user' ? 'You' : message.role === 'error' ? 'Error' : 'Agent'}</small><p>{message.text}</p></div></article>)}
        {busy && <article className="chat-message chat-message-assistant"><span><Bot className="h-4 w-4" /></span><div><small>Agent</small><p className="chat-thinking">Working<span>…</span></p></div></article>}
        <div ref={endRef} />
      </div>
      <form className="chat-composer" onSubmit={send}><textarea value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={keyDown} rows={3} placeholder="Type a request…" disabled={busy} /><div><p>Enter to send · Shift+Enter for a new line</p>{busy && selected.data.commands?.includes('agent_cancel') ? <button type="button" className="secondary-button chat-cancel" onClick={cancel}><Square className="h-3.5 w-3.5" />Stop</button> : <button type="submit" className="primary-button" disabled={!draft.trim()}><Send className="h-3.5 w-3.5" />Send</button>}</div></form>
    </section>}
  </main>;
}

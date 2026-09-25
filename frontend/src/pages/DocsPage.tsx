import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, CircleHelp, ClipboardList, Search } from "lucide-react";
import type { DocumentationGuide } from "../types";

function bullets(text: string) { return text.split(/\n|(?<=\.)\s+(?=[A-Z0-9])/).map((item) => item.replace(/^\d+\.\s*/, "").trim()).filter(Boolean); }

export default function DocsPage({ guides, loading, initialGuideId }: { guides: DocumentationGuide[]; loading: boolean; initialGuideId?: string }) {
  const [selectedId, setSelectedId] = useState(initialGuideId || "");
  const [query, setQuery] = useState("");
  useEffect(() => { if (initialGuideId) setSelectedId(initialGuideId); }, [initialGuideId]);
  const visible = guides.filter((guide) => `${guide.title} ${guide.category} ${guide.symptoms} ${guide.possible_causes}`.toLowerCase().includes(query.toLowerCase()));
  const selected = guides.find((guide) => guide.id === selectedId) || visible[0];
  const choose = (guide: DocumentationGuide) => setSelectedId(guide.id);

  return <div className="page-content docs-page">
    <div className="page-heading"><div><div className="overline">KNOWLEDGE BASE</div><h1>Troubleshooting guides</h1><p>Practical runbooks for the most common application-support issues.</p></div><div className="guide-count"><BookOpen size={16} /><strong>{guides.length || 5}</strong><span>field guides</span></div></div>
    <div className="docs-layout">
      <aside className="surface guide-nav"><div className="guide-search"><Search size={15} /><input aria-label="Search guides" placeholder="Find a guide…" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="guide-nav-label">TROUBLESHOOTING</div>{loading && <div className="guide-loading">Loading guides…</div>}{visible.map((guide, index) => <button className={`guide-nav-item ${guide.id === selected?.id ? "selected" : ""}`} key={guide.id} onClick={() => choose(guide)}><span className={`guide-number guide-number-${index}`}>{String(index + 1).padStart(2, "0")}</span><span><strong>{guide.title}</strong><small>{guide.category}</small></span><ChevronRight size={15} /></button>)}{!loading && !visible.length && <p className="guide-no-results">No guides found.</p>}<div className="guide-nav-foot"><CircleHelp size={15} /><span>Need another playbook?<br /><b>Add it to the knowledge base.</b></span></div></aside>
      <article className="surface guide-article">{selected ? <><div className="guide-article-head"><div><span className="guide-category-tag">{selected.category}</span><div className="guide-updated">SUPPORT PLAYBOOK <i /> 5 MIN READ</div></div><div className="guide-bookmark"><BookOpen size={18} /></div></div><h2>{selected.title}</h2><p className="guide-intro">Use this guide to identify the likely cause, gather useful evidence, and make a safe, verifiable fix.</p><div className="guide-rule" />
      <section className="guide-section"><div className="guide-section-icon symptom-icon"><CircleHelp size={16} /></div><div><h3>Symptoms</h3><p>{selected.symptoms}</p></div></section>
      <section className="guide-section"><div className="guide-section-icon cause-icon"><Search size={16} /></div><div><h3>Possible causes</h3><p>{selected.possible_causes}</p></div></section>
      <section className="guide-section"><div className="guide-section-icon steps-icon"><ClipboardList size={16} /></div><div><h3>Troubleshooting steps</h3><ol className="guide-steps">{bullets(selected.troubleshooting_steps).map((step, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span>{step}</li>)}</ol></div></section>
      <section className="guide-resolution"><CheckCircle2 size={17} /><div><h3>Resolution</h3><p>{selected.resolution}</p></div></section>
      <div className="guide-bottom"><span>Was this guide useful for your investigation?</span><button onClick={() => window.dispatchEvent(new CustomEvent("relay:toast", { detail: "Thanks — your feedback has been noted." }))}>Helpful <ArrowRight size={14} /></button></div>
      </> : <div className="empty-state"><div className="empty-icon"><BookOpen size={21} /></div><strong>No guide selected</strong><span>Choose a troubleshooting guide from the list.</span></div>}</article>
    </div>
  </div>;
}

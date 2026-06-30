'use client';

import MatrixBackground from '../components/MatrixBackground2';
import React from 'react';

const TERMINAL_OUTPUT = `$ reeve analyze ./binary \\
    --goal "identify what it does and how to exploit it" \\
    --kb

Session b29c1b20
  Functions : 76 total · 75 named · 16 resolved via signatures
  Components: 2   Hypotheses: 2
  Cost      : $0.041

[✓] resolve_imports       22 imports resolved
[✓] build_call_graph      76 functions, 143 edges
[✓] match_signatures      16 stdlib matches
[✓] analyze_strings       31 strings categorized
[✓] infer_types           14 type annotations
[✓] cluster_components    2 components
[✓] analyze_function      75 functions named
[✓] form_hypothesis       2 hypotheses formed
[✓] global_synthesis      done
[✓] generate_report       2,847 chars

Report saved  -> ./binary.report.md
Knowledge base -> ./binary_kb/  (55 notes)`;

const REPORT_SNIPPET = `## Vulnerability

tcache poisoning via use-after-free. The print_tcache / print_chunk
interface exposes raw fd pointers. The only safety check (is_mapped
via mincore) validates mapping but not chunk legitimacy. A forged
freelist entry that lands in mapped memory is returned by the allocator.

## Exploitation Path

1. Allocate chunks and use print_tcache to leak heap layout
2. Free a chunk, overwrite its fd via UAF write primitive
3. Allocate twice to obtain a pointer to the controlled location
4. Write &win (0x101a22) into a GOT entry or function pointer
5. Trigger execution -> win() opens and prints the flag`;

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'terminal' | 'report'>('terminal');

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl backdrop-saturate-150 border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a href="#" className="text-white text-2xl font-bold font-title">
              REeve
            </a>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white p-2 rounded-lg focus:outline-none hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            <div className={`md:flex items-center space-y-4 md:space-y-0 md:space-x-8 ${isMenuOpen ? 'block fixed md:static inset-x-0 top-[49px] bg-black/40 backdrop-blur-xl shadow-lg border-b border-white/10 p-6 z-40' : 'hidden'}`}>
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white transition-colors font-mono text-sm">Features</a>
              <a href="#demo" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white transition-colors font-mono text-sm">Demo</a>
              <a href="#why" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white transition-colors font-mono text-sm">Why REeve</a>
              <a href="/docs" onClick={() => setIsMenuOpen(false)} className="block text-gray-300 hover:text-white transition-colors font-mono text-sm">Docs</a>
              <a
                href="https://github.com/Kunull/REeve"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full md:w-auto px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 transition-all text-center font-mono text-sm font-medium"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-32 relative flex flex-col justify-center bg-transparent overflow-hidden">
        <MatrixBackground className="absolute inset-0 w-full h-full" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center py-16">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 font-title tracking-wider text-white">
              REeve
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-4 max-w-2xl mx-auto font-mono">
              AI-powered binary reverse engineering assistant.
            </p>
            <p className="text-sm text-gray-500 mb-10 max-w-xl mx-auto font-mono leading-relaxed">
              Ghidra extracts ground truth. Claude reasons over it.
              You get named functions, identified vulnerabilities, testable hypotheses,
              and a structured report in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <a
                href="https://github.com/Kunull/REeve"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-all flex items-center justify-center space-x-2 group"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                <span>View on GitHub</span>
              </a>
              <a
                href="/docs"
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-white/20 backdrop-blur-sm text-white font-medium hover:bg-white/30 transition-all flex items-center justify-center space-x-2 group border border-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Documentation</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative border-t border-white/10">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 text-center font-title uppercase tracking-wider">
              How It Works
            </h2>
            <p className="text-gray-500 text-center font-mono text-sm mb-16 max-w-2xl mx-auto">
              Static analysis runs first and produces ground truth. The LLM only sees verified facts.
              No hallucinated function names or addresses.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  ),
                  title: 'Goal-Driven Task DAG',
                  body: 'Tell REeve what you want to find in plain English. It builds a task dependency graph from your goal and executes only the passes that are relevant. No wasted compute on irrelevant analysis steps.',
                },
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4m0 0c4.418 0 8-1.79 8-4" />
                  ),
                  title: 'Evidence-Scored KnowledgeGraph',
                  body: 'Every fact extracted from the binary lands in a queryable KnowledgeGraph with confidence scores, source provenance, and dirty-flag propagation. The LLM reads from this graph, not from raw bytes.',
                },
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  ),
                  title: 'Tiered LLM Routing',
                  body: 'Haiku for fast classification. Sonnet for function naming and hypothesis formation. Opus for global synthesis and report generation. Each task is routed to the cheapest model capable of handling it.',
                },
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  ),
                  title: 'Obsidian Knowledge Base',
                  body: 'Every analysis run produces an Obsidian-compatible vault: one note per function, component, and hypothesis. Notes have YAML frontmatter, [[wikilinks]] to callees and callers, tags, and embedded decompilation.',
                },
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  ),
                  title: 'Ghidra Integration via PyGhidra',
                  body: 'REeve runs Ghidra in-process via PyGhidra with no subprocess overhead. Decompilation, xrefs, imports, strings, and binary metadata are all extracted through the same Ghidra instance.',
                },
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  ),
                  title: 'Multi-Format Report Export',
                  body: 'Reports export as Markdown, HTML, JSON (one key per section), or plain text. Every analysis session is saved to a JSON file containing the full function list, hypotheses, and report for later use.',
                },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-white/5 rounded-lg border border-white/10">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {f.icon}
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 font-mono">{f.title}</h3>
                    <p className="text-gray-400 leading-relaxed text-sm">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="py-24 relative border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 text-center font-title uppercase tracking-wider">
              Live Output
            </h2>
            <p className="text-gray-500 text-center font-mono text-sm mb-12 max-w-2xl mx-auto">
              Actual output from a CTF heap-exploitation binary. 76 functions. Under $0.05.
            </p>

            {/* Tab switcher */}
            <div className="flex gap-0 mb-0 border border-white/10 w-fit mx-auto rounded-lg overflow-hidden">
              {(['terminal', 'report'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 font-mono text-sm transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-black'
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'terminal' ? 'Terminal' : 'Report excerpt'}
                </button>
              ))}
            </div>

            {/* Terminal window */}
            <div className="border border-white/10 bg-black/80 backdrop-blur-sm rounded-lg mt-4 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-gray-500 font-mono">
                  {activeTab === 'terminal' ? 'reeve analyze' : 'binary.report.md'}
                </span>
              </div>
              <pre className="p-6 text-sm font-mono text-green-400/90 leading-relaxed overflow-x-auto whitespace-pre">
                {activeTab === 'terminal' ? TERMINAL_OUTPUT : REPORT_SNIPPET}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Why REeve */}
      <section id="why" className="py-24 relative border-t border-white/10">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 text-center font-title uppercase tracking-wider">
              Why REeve
            </h2>
            <p className="text-gray-500 text-center font-mono text-sm mb-16 max-w-2xl mx-auto">
              Existing AI-RE tools pick one of two bad tradeoffs. REeve avoids both.
            </p>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full border-collapse font-mono text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 px-6 text-left text-gray-400 font-normal"></th>
                    <th className="py-4 px-6 text-center text-white font-bold">REeve</th>
                    <th className="py-4 px-6 text-center text-gray-500 font-normal">Fixed pipelines (Kong)</th>
                    <th className="py-4 px-6 text-center text-gray-500 font-normal">Reactive LLM loops (Rikugan)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Goal-driven task selection',      true,  false, false],
                    ['Ground truth before LLM',         true,  true,  false],
                    ['No hallucinated addresses',        true,  true,  false],
                    ['Hypothesis formation + testing',   true,  false, true],
                    ['Evidence-scored KnowledgeGraph',   true,  false, false],
                    ['Obsidian knowledge base output',   true,  false, false],
                    ['Multi-format report export',       true,  false, false],
                    ['Cost tracking per model',          true,  false, false],
                  ].map(([label, reeve, kong, rikugan], i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-3 px-6 text-gray-300">{label as string}</td>
                      {[reeve, kong, rikugan].map((v, j) => (
                        <td key={j} className="py-3 px-6 text-center">
                          {v ? (
                            <svg className={`w-4 h-4 mx-auto ${j === 0 ? 'text-green-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 mx-auto text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-24 relative border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center font-title uppercase tracking-wider">
              Quick Start
            </h2>
            <div className="space-y-4">
              {[
                {
                  step: '01',
                  label: 'Set environment variables',
                  code: `export JAVA_HOME=/path/to/jdk-21
export GHIDRA_INSTALL_DIR=/path/to/ghidra_PUBLIC
export ANTHROPIC_API_KEY=sk-ant-...`,
                },
                {
                  step: '02',
                  label: 'Install',
                  code: `git clone https://github.com/Kunull/REeve
cd REeve && pip install -e .`,
                },
                {
                  step: '03',
                  label: 'Analyze a binary',
                  code: `reeve analyze ./binary \\
  --goal "identify vulnerabilities" \\
  --kb`,
                },
              ].map(({ step, label, code }) => (
                <div key={step} className="border border-white/10 bg-black/60 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10">
                    <span className="text-xs font-mono text-gray-600">{step}</span>
                    <span className="text-sm font-mono text-gray-400">{label}</span>
                  </div>
                  <pre className="p-4 text-sm font-mono text-green-400/90 overflow-x-auto">{code}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative border-t border-white/10">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6 font-title uppercase tracking-wider">
              Open Source
            </h2>
            <p className="text-gray-400 font-mono text-sm mb-10 max-w-xl mx-auto leading-relaxed">
              REeve is fully open source under the MIT license.
              Pull requests, issues, and new host bridge implementations are welcome.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/Kunull/REeve"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-all flex items-center justify-center space-x-2 group"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                <span>Star on GitHub</span>
              </a>
              <a
                href="/docs"
                className="px-8 py-4 rounded-lg bg-white/20 backdrop-blur-sm text-white font-medium hover:bg-white/30 transition-all flex items-center justify-center space-x-2 group border border-white/10"
              >
                <span>Read the Docs</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-title text-white text-lg">REeve</span>
          <a
            href="https://github.com/Kunull/REeve"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-white transition-colors font-mono text-xs"
          >
            github.com/Kunull/REeve
          </a>
        </div>
      </footer>
    </div>
  );
}

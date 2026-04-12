import { useState } from 'react';
import { Sparkles, Wand2, Star, Image as ImageIcon, CheckCircle2, Loader2, Download, Zap, Play, PenTool, Palette, BarChart3, Copy, Layers, Heart, Shield, Mail, Users, Lock, ShoppingBag, TrendingUp, FileText, Crown, Check } from 'lucide-react';

const testimonialsList = [
  { text: "Minhas miniaturas melhoraram instantaneamente. O Miniatura Forja AI gera exatamente o estilo que EU preciso para o meu canal de jogos. As visualizações subiram 40% no primeiro mês.", author: "Jake Roberts", role: "Criador de jogos", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" },
  { text: "Uma maneira rápida de criar miniaturas sem Photoshop. Costumava ficar 2 horas em cada miniatura. Agora leva 30 segundos e os resultados são melhores.", author: "Emily Chen", role: "YouTuber Tech", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" },
  { text: "Ótima ferramenta para gerar ideias rapidamente. Mesmo quando não uso a miniatura da IA diretamente, ela me dá uma inspiração incrível para meus próprios designs.", author: "Lucas Rivera", role: "Criador de conteúdo", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face" },
  { text: "Aumentei meu CTR em mais de 50%. A facilidade de testar opções no mesmo vídeo me deu uma vantagem competitiva gigantesca no nicho financeiro.", author: "Amanda Silva", role: "Finanças e Negócios", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face" },
  { text: "Finalmente uma ferramenta que entende a saturação gringa! As cores e a vibração são perfeitas. Minhas views dobraram na primeira semana de uso.", author: "Thiago Mendes", role: "Canal de Curiosidades", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&h=80&fit=crop&crop=face" },
  { text: "Como editor de vídeo, isso acelerou muito meu fluxo de trabalho. Não perco mais horas buscando assets base. A IA entrega com exelente qualidade e escala.", author: "Bruno Torres", role: "Editor Freelance", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face" },
  { text: "Foi um divisor de águas! Consigo postar vídeos diariamente porque não preciso gastar tanto tempo desenhando as thumbnails no zero. Altamente profissional.", author: "Camila Rocha", role: "Vlogs Diários", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face" },
  { text: "As expressões faciais geradas pela IA são absurdamente naturais. Meus inscritos notaram a diferença de imediato e meu engajamento está lá no alto!", author: "Diego Costa", role: "React & Comédia", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=face" }
];

function App() {
  const [style, setStyle] = useState('mrbeast');
  const [emotion, setEmotion] = useState('shock');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState([]);
  const [overlayTitle, setOverlayTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    setErrorMsg('');
    if (!title && !topic) {
      setErrorMsg("Por favor, digite o título ou o tópico do seu vídeo primeiro.");
      return;
    }

    setLoading(true);
    setThumbnails([]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic, style, emotion }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        if (!response.ok) {
          throw new Error(text.includes('504') ? 'O servidor demorou muito para responder (Timeout). Tente novamente.' : 'Erro interno no servidor ao gerar.');
        }
        throw new Error('Erro ao processar a resposta do servidor.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar miniatura');
      }

      setThumbnails(data.thumbnails);
      setOverlayTitle(data.title || title);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'Erro ao gerar miniatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ===== NAVIGATION ===== */}
      <nav className="top-nav">
        <div className="container">
          <div className="logo">
            <div className="yt-icon">
              <svg viewBox="0 0 24 24" width="18" height="18"><polygon points="10,8 16,12 10,16" fill="white"/></svg>
            </div>
            Miniatura<span className="brand-forge">Forja</span> <span className="brand-ai">AI</span>
          </div>
          <ul className="nav-links">
            <li><a href="#hero">Lar</a></li>
            <li><a href="#how">Como Funciona</a></li>
            <li><a href="#generator">Gerador Miniatura</a></li>
            <li><a href="#testimonials">Depoimentos</a></li>
            <li><a href="#pricing">Preços</a></li>
            <li><button className="btn-pro-nav" onClick={() => document.getElementById('pricing').scrollIntoView({behavior:'smooth'})}>Desbloquear PRO – R$ 97</button></li>
          </ul>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section id="hero" className="hero-section">
        <div className="hero-bg">
          <video autoPlay loop muted playsInline className="base-bg-video" src="/hero-bg.mp4" />
          <div className="base-bg-overlay"></div>
        </div>
        <div className="container">
          <div className="hero-content">

            {/* Left Column */}
            <div className="hero-left">
              <div className="hero-badge">
                <Sparkles size={14} />
                Criador de miniaturas alimentado por IA
              </div>
              <h1 className="hero-title font-heading">
                Crie miniaturas<br/>
                <span className="yt-word">virais para o<br/>YouTube</span> com IA.
              </h1>
              <p className="hero-desc">
                O Miniatura Forja AI ajuda os YouTubers a gerar miniaturas atraentes em segundos. 
                Descreva seu vídeo, escolha um estilo e deixe a IA gerar uma miniatura com alta taxa de cliques, 
                pronta para seu próximo upload.
              </p>
              <div className="hero-buttons">
                <button className="btn-primary" onClick={() => document.getElementById('generator').scrollIntoView({behavior: 'smooth'})}>
                  <Play size={16} fill="white" /> Gerar miniatura
                </button>
                <button className="btn-secondary-outline" onClick={() => document.getElementById('pricing').scrollIntoView({behavior: 'smooth'})}>
                  <Zap size={16} /> Desbloquear PRO – R$ 97
                </button>
              </div>
              <div className="stats-row">
                <div className="stat-item">
                  <div className="stat-icon"><Zap size={20} color="#FACC15" /></div>
                  <div>
                    <h4 className="font-heading">Mais de 50 mil</h4>
                    <p>Miniaturas geradas</p>
                  </div>
                </div>
                <div className="stat-item">
                  <div style={{marginRight: '0'}}></div>
                  <div>
                    <h4 className="font-heading">Mais de 12 mil</h4>
                    <p>Criadores</p>
                  </div>
                </div>
                <div className="stat-item">
                  <div>
                    <h4 className="font-heading">4.9<Star size={18} color="#FACC15" fill="#FACC15" style={{display:'inline', verticalAlign:'text-bottom', marginLeft:'4px'}}/></h4>
                    <p>Avaliação</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column — Generator */}
            <div id="generator" className="generator-card">
              <div className="generator-header">
                <h3 className="font-heading"><Sparkles size={18} color="#FACC15" /> Gerador de miniaturas com IA</h3>
                <span className="free-tag">3/3 grátis hoje</span>
              </div>
              <div className="generator-form">
                <div className="form-group">
                  <label>Título Vídeo</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Por exemplo, passei 100 dias no Minecraft..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Vídeo Tópico</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Exemplo: desafio de sobrevivência no Minecraft"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <div className="dropdowns-row">
                  <div className="form-group">
                    <label>Estilo Miniatura</label>
                    <select className="select-field" value={style} onChange={(e) => setStyle(e.target.value)}>
                      <option value="mrbeast">Estilo MrBeast</option>
                      <option value="gaming">Estilo Gaming</option>
                      <option value="tech">Tech Review</option>
                      <option value="reaction">Estilo Reação</option>
                      <option value="minimalist">Minimalista</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estilo Emoção</label>
                    <select className="select-field" value={emotion} onChange={(e) => setEmotion(e.target.value)}>
                      <option value="shock">Choque</option>
                      <option value="excitement">Excitação</option>
                      <option value="curiosity">Curiosidade</option>
                      <option value="urgency">Urgência</option>
                      <option value="neutral">Neutro</option>
                    </select>
                  </div>
                </div>

                {errorMsg && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '14px', marginTop: '4px' }}>
                    {errorMsg}
                  </div>
                )}

                <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="animate-spin" size={20} /> Gerando miniatura...</>
                  ) : (
                    <><Sparkles size={18} /> Gerar Miniatura</>
                  )}
                </button>
              </div>

              {/* Result — Grid de 2 Miniaturas com Texto Digital */}
              {thumbnails.length > 0 && (
                <div className="generated-result">
                  <h4 className="font-heading">Gerou Miniaturas</h4>
                  <div className="thumbnails-grid">
                    {thumbnails.map((thumb, i) => (
                      <div key={i} className="thumbnail-preview">
                        <img src={thumb.imageUrl} alt={`Miniatura ${i + 1}`} />
                        <div className="ctr-badge">Pontuação CTR: {thumb.ctrScore}%</div>
                        <a href={thumb.imageUrl} download={`thumbnail_${i+1}.jpg`} target="_blank" rel="noreferrer" className="download-overlay">
                          <Download size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PAY WHAT YOU WANT ===== */}
      <section className="payment-section">
        <div className="payment-bg"></div>
        <div className="container text-center" style={{position:'relative', zIndex:1, maxWidth: '900px'}}>
          <div className="section-badge yellow" style={{display:'inline-flex', alignItems:'center', gap:'6px'}}>💰 Oferta Especial e Exclusiva</div>
          <h2 className="section-title font-heading" style={{fontSize: '42px', marginTop: '20px', lineHeight: '1.2'}}>
            Garanta Agora com <span className="highlight-yellow">Desconto Imperdível</span><br/>
            <span className="highlight-red">& Acesso Ilimitado ao Sistema</span>
          </h2>
          
          <p style={{color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '40px', padding: '0 40px'}}>
            Construímos a Miniatura Forja AI com centenas de horas de trabalho — e queremos disponibilizá-lo a todos os criadores, com preço acessível.<br/><br/>
            Adquira agora por um preço especial de lançamento e receba o <strong style={{color: 'var(--primary-yellow)'}}>modelo PRO ilimitado</strong> diretamente na sua conta. Sem complicações. Sem mensalidades ocultas. Total transparência.
          </p>

          <div className="payment-features-grid">
            <div className="feature-card" style={{background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '24px', borderRadius: '12px'}}>
              <Shield size={20} color="#22c55e" style={{marginBottom: '16px'}} />
              <h4 style={{color: '#fff', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold'}}>Pagamento Único de $97</h4>
              <p style={{fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5'}}>Pague apenas $97 e tenha acesso ilimitado para gerar miniaturas como quiser. Sem mensalidades.</p>
            </div>
            <div className="feature-card" style={{background: 'rgba(250, 204, 21, 0.05)', border: '1px solid rgba(250, 204, 21, 0.2)', padding: '24px', borderRadius: '12px'}}>
              <Mail size={20} color="#FACC15" style={{marginBottom: '16px'}} />
              <h4 style={{color: '#fff', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold'}}>Ativação Instantânea</h4>
              <p style={{fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5'}}>Sua licença PRO ilimitada é ativada imediatamente após a confirmação do pagamento.</p>
            </div>
            <div className="feature-card" style={{background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '24px', borderRadius: '12px'}}>
              <Users size={20} color="#ef4444" style={{marginBottom: '16px'}} />
              <h4 style={{color: '#fff', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold'}}>Você Apoia o Desenvolvimento</h4>
              <p style={{fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5'}}>Sua compra permite atualizações futuras e mantém esta ferramenta evoluindo constantemente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="section">
        <div className="container text-center">
          <div className="section-badge">Como Funciona</div>
          <h2 className="section-title font-heading">
            Crie miniaturas <span className="highlight-yellow">Com um clique</span>
          </h2>
          <div className="steps-grid">
            <div className="step-card" style={{position: 'relative'}}>
              <div style={{position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '90px', fontWeight: '900', color: 'rgba(239, 68, 68, 0.07)', zIndex: 0, lineHeight: 1, letterSpacing: '-2px'}}>01</div>
              <div className="step-icon" style={{position: 'relative', zIndex: 1, margin: '20px auto 24px', width: '70px', height: '70px', borderRadius: '18px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <FileText size={30} color="#ef4444" />
              </div>
              <h3 className="font-heading" style={{position: 'relative', zIndex: 1}}>Descreva seu vídeo</h3>
              <p style={{position: 'relative', zIndex: 1}}>Insira o título e o tópico do seu vídeo para fornecer à IA o contexto necessário.</p>
            </div>
            
            <div className="step-card" style={{position: 'relative'}}>
              <div style={{position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '90px', fontWeight: '900', color: 'rgba(250, 204, 21, 0.07)', zIndex: 0, lineHeight: 1, letterSpacing: '-2px'}}>02</div>
              <div className="step-icon" style={{position: 'relative', zIndex: 1, margin: '20px auto 24px', width: '70px', height: '70px', borderRadius: '18px', border: '1px solid rgba(250, 204, 21, 0.3)', background: 'rgba(250, 204, 21, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Palette size={30} color="#FACC15" />
              </div>
              <h3 className="font-heading" style={{position: 'relative', zIndex: 1}}>Escolha um estilo</h3>
              <p style={{position: 'relative', zIndex: 1}}>Selecione um estilo de miniatura usado por criadores de conteúdo viral e pelos principais YouTubers.</p>
            </div>
            
            <div className="step-card" style={{position: 'relative'}}>
              <div style={{position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '90px', fontWeight: '900', color: 'rgba(34, 197, 94, 0.07)', zIndex: 0, lineHeight: 1, letterSpacing: '-2px'}}>03</div>
              <div className="step-icon" style={{position: 'relative', zIndex: 1, margin: '20px auto 24px', width: '70px', height: '70px', borderRadius: '18px', border: '1px solid rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Sparkles size={30} color="#22c55e" />
              </div>
              <h3 className="font-heading" style={{position: 'relative', zIndex: 1}}>Gere com IA</h3>
              <p style={{position: 'relative', zIndex: 1}}>Obtenha miniaturas prontas para download instantaneamente com geração baseada em IA.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES / TOOLS ===== */}
      <section className="section" style={{background:'#111111'}}>
        <div className="container text-center">
          <div className="section-badge yellow" style={{display:'inline-flex'}}>Características</div>
          <h2 className="section-title font-heading">
            Ferramentas para <span className="highlight-red">Crescimento no YouTube</span>
          </h2>
          
          <div className="tools-grid-custom" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            marginTop: '48px',
            maxWidth: '1100px',
            margin: '48px auto 0'
          }}>
            <div className="tool-card-new" style={{background: '#151515', border: '1px solid #222', borderRadius: '12px', padding: '32px 24px', textAlign: 'left', borderTop: '3px solid #ef4444'}}>
              <div style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'}}>
                <Zap size={20} color="#ef4444" />
              </div>
              <h3 className="font-heading" style={{fontSize: '17px', color: '#fff', marginBottom: '12px'}}>Gerador de Miniaturas IA</h3>
              <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6'}}>Gere miniaturas poderosas e atraentes instantaneamente usando geração de imagem IA de última geração.</p>
            </div>

            <div className="tool-card-new" style={{background: '#151515', border: '1px solid #222', borderRadius: '12px', padding: '32px 24px', textAlign: 'left', borderTop: '3px solid #FACC15'}}>
              <div style={{background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.2)', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'}}>
                <Palette size={20} color="#FACC15" />
              </div>
              <h3 className="font-heading" style={{fontSize: '17px', color: '#fff', marginBottom: '12px'}}>Motor de Estilos</h3>
              <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6'}}>Escolha entre estilos de miniatura virais usados pelos maiores criadores — MrBeast, gaming, tech, reaction e muito mais.</p>
            </div>

            <div className="tool-card-new" style={{background: '#151515', border: '1px solid #222', borderRadius: '12px', padding: '32px 24px', textAlign: 'left', borderTop: '3px solid #22c55e'}}>
              <div style={{background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'}}>
                <TrendingUp size={20} color="#22c55e" />
              </div>
              <h3 className="font-heading" style={{fontSize: '17px', color: '#fff', marginBottom: '12px'}}>Otimizador de CTR</h3>
              <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6'}}>A IA estima o potencial de clique de cada miniatura e fornece uma pontuação de CTR para maximizar suas visualizações.</p>
            </div>

            <div className="tool-card-new" style={{background: '#151515', border: '1px solid #222', borderRadius: '12px', padding: '32px 24px', textAlign: 'left', borderTop: '3px solid #3b82f6'}}>
              <div style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'}}>
                <Copy size={20} color="#3b82f6" />
              </div>
              <h3 className="font-heading" style={{fontSize: '17px', color: '#fff', marginBottom: '12px'}}>Múltiplas Versões</h3>
              <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6'}}>Gere múltiplas opções de miniatura para o mesmo vídeo e faça testes A/B com diferentes abordagens visuais.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="section" style={{overflow: 'hidden'}}>
        <style dangerouslySetInnerHTML={{__html: `
          .marquee-container {
            display: flex;
            overflow: hidden;
            user-select: none;
            gap: 24px;
            padding: 20px 0;
            width: 100%;
            margin-top: 40px;
          }
          .marquee-content {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: space-around;
            gap: 24px;
            min-width: 100%;
            animation: scroll 40s linear infinite;
          }
          .marquee-container:hover .marquee-content {
            animation-play-state: paused;
          }
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-100% - 24px)); }
          }
          .testimonial-card-mq {
            background: #111;
            border: 1px solid #222;
            border-radius: 12px;
            padding: 32px;
            width: 400px;
            text-align: left;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
        `}} />
        <div className="container text-center">
          <div className="section-badge inline-flex">★ Depoimentos</div>
          <h2 className="section-title font-heading">
            Utilizado por <span className="highlight-yellow">criadores de conteúdo</span>
          </h2>
        </div>

        <div className="marquee-container">
          <div className="marquee-content">
            {testimonialsList.map((t, i) => (
              <div key={i} className="testimonial-card-mq">
                <div className="testimonial-stars" style={{marginBottom: '16px'}}>
                  {[1,2,3,4,5].map(star => <Star key={star} size={18} color="#FACC15" fill="#FACC15" />)}
                </div>
                <blockquote style={{fontStyle: 'italic', color: '#ccc', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px'}}>
                  "{t.text}"
                </blockquote>
                <div className="testimonial-author" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <img src={t.avatar} alt={t.author} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                  <div>
                    <div className="author-name" style={{fontWeight: 'bold', fontSize: '14px'}}>{t.author}</div>
                    <div className="author-role" style={{fontSize: '12px', color: '#888'}}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Duplicata para loop infinito */}
          <div className="marquee-content">
            {testimonialsList.map((t, i) => (
              <div key={'dup'+i} className="testimonial-card-mq">
                <div className="testimonial-stars" style={{marginBottom: '16px'}}>
                  {[1,2,3,4,5].map(star => <Star key={star} size={18} color="#FACC15" fill="#FACC15" />)}
                </div>
                <blockquote style={{fontStyle: 'italic', color: '#ccc', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px'}}>
                  "{t.text}"
                </blockquote>
                <div className="testimonial-author" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <img src={t.avatar} alt={t.author} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                  <div>
                    <div className="author-name" style={{fontWeight: 'bold', fontSize: '14px'}}>{t.author}</div>
                    <div className="author-role" style={{fontSize: '12px', color: '#888'}}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="section" style={{background: '#111111'}}>
        <div className="container text-center">
          <div className="section-badge" style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex'}}>Precificação</div>
          <h2 className="section-title font-heading" style={{marginTop: '20px'}}>
            Simples <span className="highlight-yellow">Precificação</span>
          </h2>
          <p style={{color:'var(--text-muted)', marginBottom:'48px'}}>
            Comece grátis, atualize quando estiver pronto. Sem<br/>assinaturas.
          </p>

          <div className="pricing-grid-custom">
            {/* Free */}
            <div className="pricing-card" style={{
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '40px'
            }}>
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px'}}>
                <Zap size={20} color="#888" />
                <h4 className="font-heading" style={{fontSize:'18px', color:'#fff', margin:0}}>Gratuito</h4>
              </div>
              <div className="pricing-price font-heading" style={{fontSize: '48px', color: '#fff'}}>$0</div>
              <div className="pricing-period" style={{color: '#888', marginBottom: '32px'}}>eternamente livre</div>
              
              <ul className="pricing-features" style={{listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: '#ccc', fontSize: '14px', lineHeight: '2.4'}}>
                <li style={{display:'flex', alignItems:'center', gap:'10px'}}><Check size={16} color="#888" /> 3 miniaturas por dia</li>
                <li style={{display:'flex', alignItems:'center', gap:'10px'}}><Check size={16} color="#888" /> Estilos básicos</li>
                <li style={{display:'flex', alignItems:'center', gap:'10px'}}><Check size={16} color="#888" /> Download padrão</li>
                <li style={{display:'flex', alignItems:'center', gap:'10px'}}><Check size={16} color="#888" /> Apoio comunitário</li>
              </ul>
              <button 
                style={{width: '100%', padding: '16px', background: 'transparent', border: '1px solid #333', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', marginTop: 'auto'}}
                onMouseEnter={e => e.target.style.background = '#222'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
                onClick={() => document.getElementById('generator').scrollIntoView({behavior:'smooth'})}
              >
                Iniciar Gratuito
              </button>
            </div>

            {/* PRO */}
            <div className="pricing-card pro" style={{
              background: 'linear-gradient(180deg, #150a0a 0%, #0a0a0a 100%)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 40px rgba(239, 68, 68, 0.1)', position: 'relative'
            }}>
              <div style={{position: 'absolute', top: '24px', right: '24px', background: '#FACC15', color: '#000', fontSize: '11px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '20px', letterSpacing: '0.5px'}}>
                MAIS POPULARES
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px'}}>
                <Crown size={24} color="#FACC15" className="floating-icon" />
                <h4 className="font-heading" style={{fontSize:'18px', color:'#fff', margin:0}}>PRÔ</h4>
              </div>
              <div className="pricing-price font-heading" style={{fontSize: '48px', color: '#fff'}}>R$ 97</div>
              <div className="pricing-period" style={{color: '#888', marginBottom: '32px'}}>um só tempo</div>
              
              <ul className="pricing-features" style={{listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: '#ccc', fontSize: '14px', lineHeight: '2.4'}}>
                <li style={{display:'flex', alignItems:'center', gap:'10px'}}><Check size={16} color="#FACC15" /> Geração ilimitada de miniaturas</li>
                <li style={{display:'flex', alignItems:'center', gap:'10px'}}><Check size={16} color="#FACC15" /> Estilos premium de miniaturas</li>
                <li style={{display:'flex', alignItems:'center', gap:'10px'}}><Check size={16} color="#FACC15" /> Qualidade de download HD</li>
                <li style={{display:'flex', alignItems:'center', gap:'10px'}}><Check size={16} color="#FACC15" /> Ferramentas de otimização CTR</li>
                <li style={{display:'flex', alignItems:'center', gap:'10px'}}><Check size={16} color="#FACC15" /> Apoio prioritário</li>
                <li style={{display:'flex', alignItems:'center', gap:'10px'}}><Check size={16} color="#FACC15" /> Gerador multi-versão</li>
              </ul>
              <button 
                style={{width: '100%', padding: '16px', background: '#FF0000', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s', marginTop: 'auto'}}
                onMouseEnter={e => e.target.style.background = '#CC0000'}
                onMouseLeave={e => e.target.style.background = '#FF0000'}
              >
                Desbloquear PRO
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <div className="yt-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16"><polygon points="10,8 16,12 10,16" fill="white"/></svg>
                </div>
                Miniatura<span className="brand-forge">Forja</span> <span className="brand-ai">AI</span>
              </div>
              <p>Gerador de miniaturas com inteligência artificial, projetado para ajudar YouTubers a criar miniaturas com alta taxa de cliques (CTR) mais rapidamente.</p>
            </div>
            <div className="footer-links">
              <h4 className="font-heading">Navegação</h4>
              <ul>
                <li><a href="#hero">Lar</a></li>
                <li><a href="#how">Como funciona</a></li>
                <li><a href="#pricing">Preços</a></li>
                <li><a href="#testimonials">Contato</a></li>
              </ul>
            </div>
            <div className="footer-cta">
              <h4 className="font-heading">Comece agora</h4>
              <p>Comece a criar miniaturas virais hoje mesmo.</p>
              <button className="btn-pro-nav" onClick={() => document.getElementById('pricing').scrollIntoView({behavior:'smooth'})}>
                Desbloquear o PRO – R$ 97
              </button>
            </div>
          </div>
          <div className="footer-copyright">
            © 2026 Miniatura Forja AI. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;

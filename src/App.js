import './App.css';
import Canvas from './Canvas';
import { recognizeHandwritingWithVision } from './vision';
import { KNOWN_CLASSES } from './recognizer';
import React, { useState } from 'react';
import SectionCard from './SectionCard';
import BrandInfoCard from './BrandInfoCard';

// Inline TweetCard component for tweet display
// InfoCard for web info queries
function InfoCard({ title, content, left, top, onClose, onDrag }) {
  const [dragging, setDragging] = React.useState(false);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const cardRef = React.useRef(null);
  const handleMouseDown = e => {
    setDragging(true);
    const rect = cardRef.current.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.stopPropagation();
  };
  const handleMouseMove = e => {
    if (!dragging) return;
    onDrag(e.clientX - offset.x, e.clientY - offset.y);
  };
  const handleMouseUp = () => setDragging(false);
  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });
  return (
    <div
      ref={cardRef}
      className="info-card"
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 120,
        minWidth: 260,
        maxWidth: 380,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 2px 16px 0 rgba(0,0,0,0.13)',
        border: '1.5px solid #1da1f2',
        padding: '1.1em 1.5em 1.1em 1.1em',
        cursor: 'grab',
        userSelect: 'none',
        fontFamily: 'system-ui, sans-serif',
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ fontWeight: 700, color: '#1da1f2', fontSize: 18, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 16, color: '#222', marginBottom: 8 }}>{content}</div>
      <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, border: 'none', background: 'none', color: '#1da1f2', fontSize: 20, cursor: 'pointer' }}>&times;</button>
    </div>
  );
}

function TweetCard({ tweet, left, top, onClose, onDrag, draggable }) {

// InfoCard for web info queries
function InfoCard({ title, content, left, top, onClose, onDrag }) {
  const [dragging, setDragging] = React.useState(false);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const cardRef = React.useRef(null);
  const handleMouseDown = e => {
    setDragging(true);
    const rect = cardRef.current.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.stopPropagation();
  };
  const handleMouseMove = e => {
    if (!dragging) return;
    onDrag(e.clientX - offset.x, e.clientY - offset.y);
  };
  const handleMouseUp = () => setDragging(false);
  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });
  return (
    <div
      ref={cardRef}
      className="info-card"
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 120,
        minWidth: 260,
        maxWidth: 380,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 2px 16px 0 rgba(0,0,0,0.13)',
        border: '1.5px solid #1da1f2',
        padding: '1.1em 1.5em 1.1em 1.1em',
        cursor: 'grab',
        userSelect: 'none',
        fontFamily: 'system-ui, sans-serif',
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ fontWeight: 700, color: '#1da1f2', fontSize: 18, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 16, color: '#222', marginBottom: 8 }}>{content}</div>
      <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, border: 'none', background: 'none', color: '#1da1f2', fontSize: 20, cursor: 'pointer' }}>&times;</button>
    </div>
  );
}

  const [dragging, setDragging] = React.useState(false);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const cardRef = React.useRef(null);
  const handleMouseDown = e => {
    if (!draggable) return;
    setDragging(true);
    const rect = cardRef.current.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.stopPropagation();
  };
  const handleMouseMove = e => {
    if (!dragging) return;
    onDrag(e.clientX - offset.x, e.clientY - offset.y);
  };
  const handleMouseUp = () => setDragging(false);
  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });
  return (
    <div
      ref={cardRef}
      className="tweet-card"
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 120,
        minWidth: 320,
        maxWidth: 400,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 2px 16px 0 rgba(0,0,0,0.13)',
        border: '1.5px solid #1da1f2',
        padding: '1.2em 1.7em 1.2em 1.2em',
        cursor: draggable ? 'grab' : 'default',
        userSelect: 'none',
        fontFamily: 'system-ui, sans-serif',
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ fontWeight: 700, color: '#1da1f2', fontSize: 18, marginBottom: 6 }}>
        @{tweet.username}
      </div>
      <div style={{ fontSize: 16, color: '#222', marginBottom: 8 }}>
        {tweet.text}
      </div>
      <div style={{ color: '#888', fontSize: 14 }}>
        ❤️ {tweet.likes} &nbsp;·&nbsp; {tweet.date}
      </div>
      <a href={tweet.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1da1f2', textDecoration: 'none', fontSize: 13 }}>View on X</a>
      <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, border: 'none', background: 'none', color: '#1da1f2', fontSize: 20, cursor: 'pointer' }}>&times;</button>
    </div>
  );
}


const SECTION_CONTENT = {
  pen: {
    title: 'Copywriting',
    desc: 'Words that spark action. Our copywriters craft compelling stories, taglines, and campaigns that connect.',
    color: '#2d6be6',
    icon: '✏️',
    projects: [
      { title: 'Brand Launch for Nifty', desc: 'Taglines, web copy, and campaign for a fintech startup.', img: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=facearea&w=96&q=80',
        mockDetails: { img: 'https://media.giphy.com/media/l4EoTHjQ2q9qHqkLu/giphy.gif', label: 'Campaign Video', extra: 'Award-winning launch with 1M+ impressions.' }
      },
      { title: 'Social Impact Sprints', desc: 'Messaging for a global non-profit initiative.', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=96&q=80',
        mockDetails: { img: 'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif', label: 'Behind-the-scenes', extra: 'Real-time copy sprints for social good.' }
      }
    ],
    mockExtra: <div><strong>Fun Fact:</strong> Our copy was featured in AdWeek’s “Top 10 Campaigns”.<br /><em>"Creativity is intelligence having fun."</em></div>
  },
  c: {
    title: 'Copywriting',
    desc: 'Reveal the power of words. Copy that converts, inspires, and delights.',
    color: '#2d6be6',
    icon: '📝',
    projects: [
      { title: 'E-commerce Campaign', desc: 'Product descriptions and ads for a lifestyle brand.', img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=facearea&w=96&q=80',
        mockDetails: { img: 'https://media.giphy.com/media/3o6Zt8zb1kQK5R0uGs/giphy.gif', label: 'Ad Reel', extra: 'Conversion rate up 24% in 3 months.' }
      }
    ],
    mockExtra: <div><strong>Our secret:</strong> Every word is tested for emotional impact.</div>
  },
  lightbulb: {
    title: 'Ideation',
    desc: 'Ideas that illuminate. We brainstorm, strategize, and invent creative solutions for your brand.',
    color: '#ffb300',
    icon: '💡',
    projects: [
      { title: 'Innovation Hackathon', desc: 'Generated 100+ ideas for a major tech conference.', img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=96&q=80',
        mockDetails: { img: 'https://media.giphy.com/media/3o6Zt7xTgkQhQ6s6VW/giphy.gif', label: 'Pitch Deck', extra: '10 ideas selected for VC funding.' }
      },
      { title: 'Naming Sprint', desc: 'Brand names for a new beverage line.', img: 'https://images.unsplash.com/photo-1482062364825-616fd23b8fc1?auto=format&fit=facearea&w=96&q=80',
        mockDetails: { img: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif', label: 'Name Reveal', extra: 'Client chose “Fizzique” from 200+ options.' }
      }
    ],
    mockExtra: <div><strong>Did you know?</strong> Our brainstorms are powered by coffee and wild ideas ☕💡</div>
  },
  star: {
    title: 'Design',
    desc: 'Designs that dazzle. Visuals, branding, and UI/UX that make your brand shine.',
    color: '#e66b2d',
    icon: '⭐',
    projects: [
      { title: 'App UI for Flowly', desc: 'Mobile UI/UX for a wellness app.', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=facearea&w=96&q=80',
        mockDetails: { img: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', label: 'UI Walkthrough', extra: 'Winner: Best App Design 2024.' }
      },
      { title: 'Brand Identity: Aurora', desc: 'Logo, palette, and style guide for a creative studio.', img: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3d41?auto=format&fit=facearea&w=96&q=80',
        mockDetails: { img: 'https://media.giphy.com/media/3o6ZtpxSZbQRRnwCKQ/giphy.gif', label: 'Logo Reveal', extra: 'Brand colors inspired by the northern lights.' }
      }
    ],
    mockExtra: <div><strong>Design Philosophy:</strong> “Form follows fun.”</div>
  }
};


function App() {
  // Eraser mode
  const [isEraserActive, setIsEraserActive] = useState(false);
  // Array of revealed sections: { key, x, y, id }
  const [revealedSections, setRevealedSections] = useState([]); // { key, x, y, id }
  // Brand info popups: { info, x, y, id }
  const [brandPopups, setBrandPopups] = useState([]); // { info, x, y, id }
  const [cardId, setCardId] = useState(1);
  const [brandInput, setBrandInput] = useState('');
  const [showBrandInput, setShowBrandInput] = useState(false);
  // Handwriting fallback state
  const [showHandwritingPrompt, setShowHandwritingPrompt] = useState(false);
  const [pendingHandwritingPaths, setPendingHandwritingPaths] = useState(null);
  const [handwritingBrand, setHandwritingBrand] = useState('');
  const [isHandwritingLoading, setIsHandwritingLoading] = useState(false);
  // Twitter/X integration state
  const [tweetCards, setTweetCards] = useState([]);
  const [infoCards, setInfoCards] = useState([]); // for web info queries
  const [chatInput, setChatInput] = useState("");
  const [isQueryLoading, setIsQueryLoading] = useState(false);


  const handleSectionReveal = (key, centroid) => {
    if (
      revealedSections.some(
        s => s.key === key && Math.abs(s.x - centroid.x) < 60 && Math.abs(s.y - centroid.y) < 60
      )
    ) {
      return;
    }
    setRevealedSections(sections => [
      ...sections,
      { key, x: centroid.x, y: centroid.y, id: cardId }
    ]);
    setCardId(id => id + 1);
  };
  const handleClose = id => {
    setRevealedSections(sections => sections.filter(s => s.id !== id));
    setBrandPopups(popups => popups.filter(p => p.id !== id));
  };
  // Erase popup handler
  const handleErasePopup = id => handleClose(id);
  // Drag handlers for popups
  const handleSectionDrag = (id, newX, newY) => {
    setRevealedSections(sections => sections.map(s => s.id === id ? { ...s, x: newX, y: newY } : s));
  };
  const handleBrandDrag = (id, newX, newY) => {
    setBrandPopups(popups => popups.map(p => p.id === id ? { ...p, left: newX, top: newY } : p));
  };

  // Offset cards to avoid going offscreen
  function getCardPos(x, y) {
    const pad = 40;
    const w = 340, h = 220;
    const maxX = window.innerWidth - w - pad;
    const maxY = window.innerHeight - h - pad;
    return {
      left: Math.max(pad, Math.min(x - w / 2, maxX)),
      top: Math.max(pad, Math.min(y - h / 2, maxY))
    };
  }
  function getBrandPopupPos(idx, n) {
    // Distribute popups in a circle around center
    const r = Math.min(window.innerWidth, window.innerHeight) / 2.3;
    const angle = (2 * Math.PI * idx) / n - Math.PI / 2;
    const cx = window.innerWidth / 2 + r * Math.cos(angle);
    const cy = window.innerHeight / 2 + r * Math.sin(angle);
    return { left: Math.max(30, Math.min(cx, window.innerWidth - 350)), top: Math.max(30, Math.min(cy, window.innerHeight - 200)) };
  }
  function handleBrandInputSubmit(e) {
    e.preventDefault();
    if (!brandInput.trim()) return;
    showBrandPopupsForBrand(brandInput.trim());
    setShowBrandInput(false);
    setBrandInput('');
  }
  function showBrandPopupsForBrand(brand) {
    const color = '#9b51e0';
    const mockInfos = [
      {
        title: `Top Ad: ${brand}`,
        text: `"Just Do It" - The most iconic campaign by ${brand}.`,
        img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=96&q=80',
        color,
        link: 'https://www.adsoftheworld.com/'
      },
      {
        title: `Recent Campaign`,
        text: `${brand} launched "Dream Crazier" in 2024, inspiring millions.`,
        img: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3d41?auto=format&fit=facearea&w=96&q=80',
        color,
        link: 'https://www.campaignlive.com/'
      },
      {
        title: `Brand Slogan`,
        text: `Slogan: "${brand === 'Nike' ? 'Just Do It' : 'Think Different'}"`,
        color,
        img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=facearea&w=96&q=80',
      },
      {
        title: `Social Presence`,
        text: `${brand} has 10M+ followers on Instagram.`,
        color,
        img: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=facearea&w=96&q=80',
        link: 'https://instagram.com/'
      }
    ];
    setBrandPopups(
      mockInfos.map((info, idx) => ({ info, ...getBrandPopupPos(idx, mockInfos.length), id: cardId + idx }))
    );
    setCardId(id => id + mockInfos.length);
  }
  async function handleHandwritingFallback(paths) {
    setIsHandwritingLoading(true);
    setShowHandwritingPrompt(false);
    setPendingHandwritingPaths(paths);
    setHandwritingBrand('');
    // Call Google Vision
    const recognized = await recognizeHandwritingWithVision(paths);
    setIsHandwritingLoading(false);
    if (recognized && recognized.trim()) {
      showBrandPopupsForBrand(recognized.trim());
      setPendingHandwritingPaths(null);
      setHandwritingBrand('');
    } else {
      setShowHandwritingPrompt(true);
      // fallback to manual prompt
    }
  }
  function handleHandwritingPromptSubmit(e) {
    e.preventDefault();
    if (!handwritingBrand.trim()) return;
    showBrandPopupsForBrand(handwritingBrand.trim());
    setShowHandwritingPrompt(false);
    setPendingHandwritingPaths(null);
    setHandwritingBrand('');
  }
  function handleHandwritingPromptCancel() {
    setShowHandwritingPrompt(false);
    setPendingHandwritingPaths(null);
    setHandwritingBrand('');
  }

  // Show Twitter prompt and fetch (mock) tweets

  // Unified chat bar handler
  async function handleChatSubmit(e) {
    e.preventDefault();
    const input = chatInput.trim();
    if (!input) return;
    setIsQueryLoading(true);
    setChatInput("");
    // Twitter query
    if (input.toLowerCase().startsWith("twitter ")) {
      const username = input.split(" ")[1];
      try {
        const res = await fetch(`http://localhost:4000/api/top-tweets/${encodeURIComponent(username)}`);
        const data = await res.json();
        if (!res.ok || !data.tweets) throw new Error(data.error || 'No tweets found');
        const tweets = data.tweets;
        // Place tweet cards in a fan pattern near the center
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        setTweetCards(cards => [
          ...cards,
          ...tweets.map((tweet, i) => ({
            tweet: { ...tweet, username },
            left: cx - 180 + i * 60,
            top: cy - 80 + i * 30,
            id: `tweet-${tweet.id}-${Date.now()}`
          }))
        ]);
      } catch (err) {
        alert('Failed to fetch tweets: ' + err.message);
      } finally {
        setIsQueryLoading(false);
      }
      return;
    }
    // Web info query (via backend Gemini)
    try {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      const res = await fetch('http://localhost:4000/api/gemini-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input })
      });
      const data = await res.json();
      if (!res.ok || !data.cards) throw new Error(data.error || 'No Gemini answer');
      setInfoCards(cards => [
        ...cards,
        ...data.cards.map((card, i) => ({
          ...card,
          left: cx - 120 + i * 120 + Math.random() * 60,
          top: cy - 100 + Math.random() * 60,
          id: `info-${Date.now()}-${i}`
        }))
      ]);
    } catch (err) {
      alert('Gemini error: ' + err.message);
    } finally {
      setIsQueryLoading(false);
    }
  }
  function handleTweetDrag(id, newX, newY) {
    setTweetCards(cards => cards.map(card => card.id === id ? { ...card, left: newX, top: newY } : card));
  }
  function handleTweetClose(id) {
    setTweetCards(cards => cards.filter(card => card.id !== id));
  }
  function handleInfoDrag(id, newX, newY) {
    setInfoCards(cards => cards.map(card => card.id === id ? { ...card, left: newX, top: newY } : card));
  }
  function handleInfoClose(id) {
    setInfoCards(cards => cards.filter(card => card.id !== id));
  }

  return (
    <div className="App" style={{ paddingBottom: '70px' }}>

      <Canvas
        onSectionReveal={handleSectionReveal}
        isEraserActive={isEraserActive}
        onErasePopup={handleErasePopup}
        onHandwritingFallback={handleHandwritingFallback}
      />
      <div className="main-overlay" style={{ pointerEvents: 'none' }}>
        <h1 className="agency-title">Blank Canvas</h1>
        <p className="subtitle">Draw to reveal our creative world</p>
      </div>
      <button
        className="eraser-btn"
        style={{ position: 'fixed', right: 32, bottom: 92, zIndex: 100, background: isEraserActive ? '#f8bbd0' : '#fff', border: '2px solid #e91e63', borderRadius: '50%', width: 54, height: 54, boxShadow: isEraserActive ? '0 0 0 3px #e91e6333' : '', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setIsEraserActive(e => !e)}
        title={isEraserActive ? 'Switch to Pencil' : 'Switch to Eraser'}
      >
        <img src={isEraserActive ? "/eraser-cursor.svg" : "/pencil-cursor.svg"} alt="eraser" style={{ width: 32, height: 32 }} />
      </button>
      <button
        className="brand-search-btn"
        style={{ position: 'fixed', right: 32, bottom: 32, zIndex: 99 }}
        onClick={() => setShowBrandInput(true)}
      >
        + Brand AI Search
      </button>
      {showBrandInput && (
        <form
          className="brand-input-overlay"
          onSubmit={handleBrandInputSubmit}
          style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.87)' }}
        >
          <input
            autoFocus
            className="brand-input"
            type="text"
            placeholder="Enter a brand name (e.g. Nike)"
            value={brandInput}
            onChange={e => setBrandInput(e.target.value)}
            style={{ fontSize: '1.4rem', padding: '0.7em 2em', borderRadius: '2em', border: '2px solid #9b51e0', outline: 'none', minWidth: 220 }}
          />
          <button type="submit" style={{ marginLeft: 16, fontSize: '1.2rem', borderRadius: '2em', border: 'none', background: '#9b51e0', color: '#fff', padding: '0.7em 2em', cursor: 'pointer' }}>Go</button>
          <button type="button" style={{ marginLeft: 8, fontSize: '1.2rem', borderRadius: '2em', border: 'none', background: '#eee', color: '#9b51e0', padding: '0.7em 2em', cursor: 'pointer' }} onClick={() => setShowBrandInput(false)}>Cancel</button>
        </form>
      )}
      {revealedSections.map(({ key, x, y, id }) =>
        SECTION_CONTENT[key] ? (
          <SectionCard
            key={id}
            section={SECTION_CONTENT[key]}
            x={getCardPos(x, y).left}
            y={getCardPos(x, y).top}
            onClose={() => handleClose(id)}
            draggable={!isEraserActive}
            onDrag={(newX, newY) => handleSectionDrag(id, newX, newY)}
            isEraserActive={isEraserActive}
            onErase={() => handleErasePopup(id)}
          />
        ) : null
      )}
      {isHandwritingLoading && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.92)' }}>
          <div style={{ fontSize: '1.4rem', color: '#9b51e0', fontWeight: 700 }}>Recognizing handwriting…</div>
        </div>
      )}
      {showHandwritingPrompt && (
        <form
          className="brand-input-overlay"
          onSubmit={handleHandwritingPromptSubmit}
          style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.87)' }}
        >
          <input
            autoFocus
            className="brand-input"
            type="text"
            placeholder="Enter the brand name you wrote (e.g. Nike)"
            value={handwritingBrand}
            onChange={e => setHandwritingBrand(e.target.value)}
            style={{ fontSize: '1.4rem', padding: '0.7em 2em', borderRadius: '2em', border: '2px solid #9b51e0', outline: 'none', minWidth: 220 }}
          />
          <button type="submit" style={{ marginLeft: 16, fontSize: '1.2rem', borderRadius: '2em', border: 'none', background: '#9b51e0', color: '#fff', padding: '0.7em 2em', cursor: 'pointer' }}>Go</button>
          <button type="button" style={{ marginLeft: 8, fontSize: '1.2rem', borderRadius: '2em', border: 'none', background: '#eee', color: '#9b51e0', padding: '0.7em 2em', cursor: 'pointer' }} onClick={handleHandwritingPromptCancel}>Cancel</button>
        </form>
      )}
      {brandPopups.map(({ info, left, top, id }) => (
        <BrandInfoCard
          key={id}
          info={info}
          left={left}
          top={top}
          onClose={() => handleClose(id)}
          draggable={!isEraserActive}
          onDrag={(newX, newY) => handleBrandDrag(id, newX, newY)}
          isEraserActive={isEraserActive}
          onErase={() => handleErasePopup(id)}
        />
      ))}
      {tweetCards.map(({ tweet, left, top, id }) => (
        <TweetCard
          key={id}
          tweet={tweet}
          left={left}
          top={top}
          draggable={true}
          onDrag={(x, y) => handleTweetDrag(id, x, y)}
          onClose={() => handleTweetClose(id)}
        />
      ))}
      {infoCards.map(({ title, content, left, top, id }) => (
        <InfoCard
          key={id}
          title={title}
          content={content}
          left={left}
          top={top}
          onClose={() => handleInfoClose(id)}
          onDrag={(x, y) => handleInfoDrag(id, x, y)}
        />
      ))}

      {/* Chat bar */}
      <form
        onSubmit={handleChatSubmit}
        style={{
          position: 'fixed', left: 0, bottom: 0, width: '100vw', zIndex: 300,
          background: 'rgba(245,248,250,0.96)', borderTop: '1.5px solid #e5e9ef',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.3em 0',
          boxShadow: '0 -2px 10px 0 rgba(0,0,0,0.04)'
        }}
      >
        <input
          type="text"
          placeholder="Type a query… (try: twitter elonmusk or what is OpenAI?)"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          style={{
            fontSize: '1.08rem', borderRadius: '2em', border: '1.5px solid #1da1f2',
            outline: 'none', minWidth: 200, maxWidth: 480, padding: '0.6em 1.6em', margin: '0 7px', flex: 1,
            background: '#fff', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)'
          }}
          disabled={isQueryLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          style={{ fontSize: '1rem', borderRadius: '2em', border: 'none', background: '#1da1f2', color: '#fff', padding: '0.6em 1.8em', cursor: 'pointer', fontWeight: 700, marginRight: 7 }}
          disabled={isQueryLoading}
        >
          {isQueryLoading ? 'Loading…' : 'Send'}
        </button>
      </form>
    </div>
  );
}



export default App;

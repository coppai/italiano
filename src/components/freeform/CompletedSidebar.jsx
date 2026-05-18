import { speakItalian } from '../../lib/speak.js';

export default function CompletedSidebar({ items, getLabel, getSpeech }) {
  // Newest first — legacy used sidebarList.prepend(item)
  const reversed = [...items].reverse();
  return (
    <div className="sidebar">
      <h3>Completed Words</h3>
      <div id="sidebar-list">
        {reversed.map((item, idx) => (
          <div className="sidebar-item" key={idx}>
            <span className="sidebar-text">{getLabel(item)}</span>
            <button className="btn-play" onClick={() => speakItalian(getSpeech(item))}>🔊</button>
          </div>
        ))}
      </div>
    </div>
  );
}

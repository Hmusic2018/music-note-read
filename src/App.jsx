import { useEffect, useRef, useState } from "react";
import { Renderer, Stave, StaveNote, Voice, Formatter } from "vexflow";

// ✅ 音效
const SOUND = {
  correct: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3"),
  wrong: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3"),
  levelup: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3"),
};

// ✅ 谱号配置
const clefs = ["treble", "bass", "alto", "tenor"];
const clefRanges = {
  treble: ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5", "d/5", "e/5"],
  bass: ["e/2", "f/2", "g/2", "a/2", "b/2", "c/3", "d/3", "e/3", "f/3", "g/3"],
  alto: ["c/3", "d/3", "e/3", "f/3", "g/3", "a/3", "b/3", "c/4", "d/4", "e/4"],
  tenor: ["a/2", "b/2", "c/3", "d/3", "e/3", "f/3", "g/3", "a/3", "b/3", "c/4"],
};

const noteToLetter = {
  c: "C", d: "D", e: "E", f: "F", g: "G", a: "A", b: "B"
};

function getRandomNote(clef) {
  const range = clefRanges[clef];
  const note = range[Math.floor(Math.random() * range.length)];
  const [letter] = note.split("/");
  return { notation: note, letter: noteToLetter[letter] };
}

function Score({ noteKey, clef }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !noteKey) return;
    containerRef.current.innerHTML = "";
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(300, 150);
    const context = renderer.getContext();
    const stave = new Stave(10, 40, 250);
    stave.addClef(clef).setContext(context).draw();

    const note = new StaveNote({
      keys: [noteKey],
      duration: "w",
      clef,
    });

    const voice = new Voice({ num_beats: 4, beat_value: 4, strict: false });
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], 200);
    voice.draw(context, stave);
  }, [noteKey, clef]);

  return <div ref={containerRef} />;
}

function NoteSelector({ onNoteSelect, disabled }) {
  const notes = ["A", "B", "C", "D", "E", "F", "G"];
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
      {notes.map((note) => (
        <button
          key={note}
          onClick={() => !disabled && onNoteSelect(note)}
          disabled={disabled}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1.2rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            backgroundColor: "#f9f9f9",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {note}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [clef, setClef] = useState("treble");
  const [noteObj, setNoteObj] = useState(getRandomNote("treble"));
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [stars, setStars] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("note-read-stats");
    return saved ? JSON.parse(saved) : { total: 0, correct: 0, mistakes: {} };
  });

  const saveStats = (newStats) => {
    setStats(newStats);
    localStorage.setItem("note-read-stats", JSON.stringify(newStats));
  };

  const nextNote = () => {
    setNoteObj(getRandomNote(clef));
    setAttempts(0);
    setMessage("");
    setDisabled(false);
    setShowContinue(false);
  };

  const handleNoteSelect = (note) => {
    if (disabled) return;

    if (note === noteObj.letter) {
      SOUND.correct.play();
      setMessage("✅ Correct!");
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);

      if (newCorrect % 15 === 0) {
        setStars((s) => s + 1);
        SOUND.levelup.play();
      }

      const newStats = {
        ...stats,
        total: stats.total + 1,
        correct: stats.correct + 1,
      };
      saveStats(newStats);
      setDisabled(true);
      setTimeout(() => nextNote(), 1000);
    } else {
      SOUND.wrong.play();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const newMistakes = { ...stats.mistakes };
      newMistakes[noteObj.letter] = (newMistakes[noteObj.letter] || 0) + 1;

      const newStats = {
        ...stats,
        total: stats.total + 1,
        mistakes: newMistakes,
      };
      saveStats(newStats);

      if (newAttempts >= 3) {
        setMessage(`❌ Correct answer: ${noteObj.letter}`);
        setDisabled(true);
        setShowContinue(true);
      } else {
        setMessage(`❌ Try again (${3 - newAttempts} left)`);
      }
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "1rem", fontFamily: "Arial" }}>
      <h1>🎼 Music Note Recognition</h1>

      {/* 谱号选择按钮 */}
      <div style={{ marginBottom: "1rem" }}>
        {clefs.map((c) => (
          <button
            key={c}
            onClick={() => {
              setClef(c);
              setNoteObj(getRandomNote(c));
              setMessage("");
              setDisabled(false);
              setShowContinue(false);
            }}
            style={{
              margin: "0 5px",
              padding: "6px 12px",
              backgroundColor: clef === c ? "#ccc" : "#eee",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <Score noteKey={noteObj.notation} clef={clef} />
      <NoteSelector onNoteSelect={handleNoteSelect} disabled={disabled} />
      <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>{message}</p>

      {showContinue && (
        <button
          onClick={nextNote}
          style={{
            marginTop: "1rem",
            padding: "0.6rem 1.2rem",
            fontSize: "1rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ✅ Continue
        </button>
      )}

      <p style={{ marginTop: "1rem" }}>
        ⭐️ Stars: {"⭐️".repeat(stars)} | Correct: {correctCount}
      </p>
      <p>
        Total: {stats.total} | Accuracy:{" "}
        {stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0}%
      </p>

      <button
        onClick={() => {
          localStorage.removeItem("note-read-stats");
          setStats({ total: 0, correct: 0, mistakes: {} });
        }}
        style={{
          marginTop: "1rem",
          padding: "0.4rem 1rem",
          borderRadius: "6px",
          backgroundColor: "#eee",
          border: "1px solid #ccc",
          cursor: "pointer",
        }}
      >
        🗑️ Reset Stats
      </button>
    </div>
  );
}

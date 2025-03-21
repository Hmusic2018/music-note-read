import { useEffect, useRef, useState } from "react";
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
} from "vexflow";
import logo from "/logo.png"; // Import new Logo

// Sound Effects
const SOUND = {
  correct: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3"),
  wrong: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3"),
  levelup: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3"),
};

// Supported Clefs
const clefs = ["treble", "bass", "alto", "tenor"];

// Limit notes to maximum 2 ledger lines above/below staff
const clefRanges = {
  treble: ["b/3", "c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5", "d/5", "e/5", "f/5", "g/5", "a/5"],
  bass: ["c/2", "d/2", "e/2", "f/2", "g/2", "a/2", "b/2", "c/3", "d/3", "e/3", "f/3", "g/3", "a/3", "b/3"],
  alto: ["e/3", "f/3", "g/3", "a/3", "b/3", "c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5"],
  tenor: ["d/3", "e/3", "f/3", "g/3", "a/3", "b/3", "c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4"],
};

// Generate a random note within the selected clef range
function getRandomNote(clef) {
  const range = clefRanges[clef];
  const note = range[Math.floor(Math.random() * range.length)];
  const pitch = note[0];
  return { key: note, pitch };
}

// Component to display the note on the staff
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

    const voice = new Voice({
      num_beats: 4,
      beat_value: 4,
      strict: false,
    });

    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], 200);
    voice.draw(context, stave);
  }, [noteKey, clef]);

  return <div ref={containerRef} />;
}

// Main App Component
function App() {
  const [clef, setClef] = useState("treble");
  const [noteObj, setNoteObj] = useState(getRandomNote("treble"));
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [stars, setStars] = useState(0);
  const [levelUpVisible, setLevelUpVisible] = useState(false);

  function nextNote() {
    setNoteObj(getRandomNote(clef));
    setAttempts(0);
    setMessage("");
  }

  function showLevelUp() {
    setLevelUpVisible(true);
    SOUND.levelup.play();
    setTimeout(() => {
      setLevelUpVisible(false);
    }, 2500);
  }

  function handleAnswer(noteName) {
    if (noteName.toLowerCase() === noteObj.pitch) {
      SOUND.correct.play();
      setMessage("✅ Correct!");
      const newCount = correctCount + 1;
      setCorrectCount(newCount);

      if (newCount % 15 === 0) {
        setStars((s) => s + 1);
        showLevelUp();
      }

      setTimeout(() => {
        nextNote();
      }, 1000);
    } else {
      SOUND.wrong.play();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setMessage(`❌ The correct answer was ${noteObj.pitch.toUpperCase()}`);
        setTimeout(() => {
          nextNote();
        }, 2000);
      } else {
        setMessage(`❌ Try again! (${3 - newAttempts} attempts left)`);
      }
    }
  }

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial", padding: "2rem", position: "relative" }}>
      <h1>🎵 Music Note Read</h1>

      <div style={{ marginBottom: "1rem" }}>
        <img src={logo} alt="Music Note Read Logo" width="150" />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Select clef: </label>
        <select
          value={clef}
          onChange={(e) => {
            const newClef = e.target.value;
            setClef(newClef);
            setNoteObj(getRandomNote(newClef));
          }}
        >
          {clefs.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <Score noteKey={noteObj.key} clef={clef} />

      <div style={{ marginTop: "1rem" }}>
        {["C", "D", "E", "F", "G", "A", "B"].map((note) => (
          <button
            key={note}
            onClick={() => handleAnswer(note)}
            style={{
              margin: "0.3rem",
              padding: "0.5rem 1rem",
              fontSize: "1.2rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
              cursor: "pointer",
              transition: "transform 0.1s",
            }}
          >
            {note}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>{message}</p>

      <p style={{ marginTop: "2rem", fontSize: "1.2rem" }}>
        Level: {Math.floor(correctCount / 15) + 1} &nbsp; | &nbsp; Stars: {stars}
      </p>

      {levelUpVisible && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#fff0b3",
            padding: "2rem",
            borderRadius: "12px",
            fontSize: "1.8rem",
            fontWeight: "bold",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            animation: "fadeInUp 0.5s ease",
          }}
        >
          🎉 Level Up! New stage unlocked!
        </div>
      )}
    </div>
  );
}

export default App;

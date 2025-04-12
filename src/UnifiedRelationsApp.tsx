// Fully fixed zoom: UI controls excluded, and line positions properly redrawn
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MAX_ELEMENTS = 5;
const EMOJIS = ["🍎", "🐶", "🚗", "🌟", "🎈", "📚", "🍕", "🎵", "⚽", "🧩"];

const translations = {
  es: {
    setA: "Conjunto A",
    setB: "Conjunto B",
    relationMatrix: "Matriz de relación",
    relation: "relación",
    function: "función",
    totalFunction: "función total",
    surjective: "suprayectiva",
    bijective: "biyectiva",
    switchTo: "Cambiar idioma",
    explanation: {
      relation:
        "En teoría de conjuntos, una relación es cualquier conjunto de pares ordenados que conecta elementos de un conjunto (A) con otro conjunto (B).",
      function:
        "Una función es una relación especial donde cada elemento de A se relaciona con a lo sumo un elemento de B.",
      totalFunction:
        "Una función total es una función donde cada elemento de A se relaciona con exactamente un elemento de B.",
      surjective: "Una función suprayectiva cubre todo el conjunto destino B.",
      bijective:
        "Una función biyectiva es tanto inyectiva como suprayectiva: cada elemento de A se relaciona con un único y distinto elemento de B, cubriendo todo B.",
    },
    pairsArrow: "Conjunto A ⟶ Conjunto B",
    pairsListRelation: "::",
    pairsListFunction: "⟼",
  },
  en: {
    setA: "Set A",
    setB: "Set B",
    relationMatrix: "Relation Matrix",
    relation: "relation",
    function: "function",
    totalFunction: "total function",
    surjective: "surjective",
    bijective: "bijective",
    switchTo: "Switch language",
    explanation: {
      relation:
        "In set theory, a relation is any set of ordered pairs connecting elements from one set (A) to another set (B).",
      function:
        "A function is a special relation where each element of A is related to at most one element of B.",
      totalFunction:
        "A total function is a function where every element of A is related to exactly one element of B.",
      surjective: "A surjective function maps onto the entire target set B.",
      bijective:
        "A bijective function is both injective and surjective—each element of A maps to a unique and distinct element of B, covering all of B.",
    },
    pairsArrow: "Set A ⟶ Set B",
    pairsListRelation: "::",
    pairsListFunction: "⟼",
  },
};

export default function UnifiedRelationsApp() {
  const [leftSet, setLeftSet] = useState(["🍎", "🚗", "📚", "🎵"]);
  const [rightSet, setRightSet] = useState(["🐶", "🌟", "🎈", "🍕", "⚽"]);
  const [relations, setRelations] = useState([]);
  const [lang, setLang] = useState("es");
  const [redrawCounter, setRedrawCounter] = useState(0);
  const svgRef = useRef();
  const leftRefs = useRef([]);
  const rightRefs = useRef([]);
  const dragStart = useRef(null);

  const t = translations[lang];

  useEffect(() => {
    const onResize = () => setRedrawCounter((c) => c + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleRelation = (i, j) => {
    const key = `${i},${j}`;
    setRelations((prev) => {
      const idx = prev.findIndex(([x, y]) => `${x},${y}` === key);
      return idx >= 0 ? prev.filter((_, k) => k !== idx) : [...prev, [i, j]];
    });
  };

  const classifyRelation = () => {
    if (relations.length === 0) return "relation";
    const leftMap = new Map();
    const rightCount = new Map();
    for (const [i, j] of relations) {
      if (!leftMap.has(i)) leftMap.set(i, []);
      leftMap.get(i).push(j);
      rightCount.set(j, (rightCount.get(j) || 0) + 1);
    }
    const isFunction = Array.from(leftMap.values()).every(
      (arr) => arr.length <= 1
    );
    const total = leftMap.size === leftSet.length;
    const surj = rightCount.size === rightSet.length;
    const injective =
      new Set(relations.map(([i, j]) => j)).size === relations.length;
    if (!isFunction) return "relation";
    if (surj && total && injective) return "bijective";
    if (surj) return "surjective";
    if (injective) return "injective";
    if (total) return "totalFunction";
    return "function";
  };

  const relationType = classifyRelation();
  const isFunction =
    Array.from(new Map(relations.map(([i, j]) => [i, j])).values()).length ===
    leftSet.length;
  const total = new Set(relations.map(([i]) => i)).size === leftSet.length;

  const getLineCoords = (i, j) => {
    const leftEl = leftRefs.current[i];
    const rightEl = rightRefs.current[j];
    if (!leftEl || !rightEl) return { x1: 0, y1: 0, x2: 0, y2: 0 };
    const leftRect = leftEl.getBoundingClientRect();
    const rightRect = rightEl.getBoundingClientRect();
    const svgRect = svgRef.current.getBoundingClientRect();
    return {
      x1: leftRect.right - svgRect.left,
      y1: leftRect.top + leftRect.height / 2 - svgRect.top,
      x2: rightRect.left - svgRect.left,
      y2: rightRect.top + rightRect.height / 2 - svgRect.top,
    };
  };

  const handleDragStart = (i, fromSet) => {
    dragStart.current = { i, fromSet };
  };

  const handleDrop = (j, toSet) => {
    const start = dragStart.current;
    if (!start || start.fromSet === toSet) return;
    if (start.fromSet === "left") toggleRelation(start.i, j);
    else toggleRelation(j, start.i);
    dragStart.current = null;
  };

  const addEmoji = (setFunc, currentSet) => {
    if (currentSet.length >= MAX_ELEMENTS) return;
    const used = [...leftSet, ...rightSet];
    const emoji = EMOJIS.find((e) => !used.includes(e)) || "➕";
    setFunc([...currentSet, emoji]);
  };

  const removeEmoji = (setFunc, currentSet, setId) => {
    if (currentSet.length === 0) return;
    const newSet = currentSet.slice(0, -1);
    setFunc(newSet);
    setRelations(
      relations.filter(
        ([i, j]) =>
          (setId === "left" ? i < newSet.length : true) &&
          (setId === "right" ? j < newSet.length : true)
      )
    );
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <button
          className="text-sm px-2 py-1 border rounded"
          onClick={() => setLang(lang === "es" ? "en" : "es")}
        >
          {t.switchTo}
        </button>
      </div>

      <div>
        <AnimatePresence mode="wait">
          <motion.h2
            key={relationType}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="text-center text-xl font-bold capitalize"
          >
            {relationType === "relation"
              ? t.relation
              : relationType === "bijective"
              ? `${
                  lang === "es"
                    ? t.function + " " + t.bijective
                    : t.bijective + " " + t.function
                }`
              : relationType === "surjective"
              ? `${
                  lang === "es"
                    ? t.function + " " + t.surjective
                    : t.surjective + " " + t.function
                }`
              : relationType === "injective"
              ? `${
                  lang === "es"
                    ? t.function + " inyectiva"
                    : "injective function"
                }`
              : relationType === "totalFunction"
              ? `${t.totalFunction}`
              : t.function}
          </motion.h2>
        </AnimatePresence>

        <div className="mt-8 border border-gray-300 shadow-sm rounded-lg">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold">{t.setA}</h2>
                  <button
                    className="text-sm px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => addEmoji(setLeftSet, leftSet)}
                    disabled={leftSet.length >= MAX_ELEMENTS}
                  >
                    +
                  </button>
                  <button
                    className="text-sm px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => removeEmoji(setLeftSet, leftSet, "left")}
                    disabled={leftSet.length === 0}
                  >
                    -
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 w-24 rounded-full border-2 border-blue-500 mx-auto"></div>
                  <div className="flex flex-col items-center gap-2 relative z-10 py-2">
                    {leftSet.map((e, i) => (
                      <div
                        key={i}
                        ref={(el) => (leftRefs.current[i] = el)}
                        className="text-3xl cursor-pointer"
                        draggable
                        onDragStart={() => handleDragStart(i, "left")}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(i, "left")}
                      >
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold">{t.setB}</h2>
                  <button
                    className="text-sm px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => addEmoji(setRightSet, rightSet)}
                    disabled={rightSet.length >= MAX_ELEMENTS}
                  >
                    +
                  </button>
                  <button
                    className="text-sm px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => removeEmoji(setRightSet, rightSet, "right")}
                    disabled={rightSet.length === 0}
                  >
                    -
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 w-24 rounded-full border-2 border-green-500 mx-auto"></div>
                  <div className="flex flex-col items-center gap-2 relative z-10 py-2">
                    {rightSet.map((e, i) => (
                      <div
                        key={i}
                        ref={(el) => (rightRefs.current[i] = el)}
                        className="text-3xl cursor-pointer"
                        draggable
                        onDragStart={() => handleDragStart(i, "right")}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(i, "right")}
                      >
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {relations.length === 0 && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 text-blue-700 text-base font-semibold italic bg-white/80 px-4 py-1 rounded shadow z-10 pointer-events-none">
                  {lang === "es"
                    ? "Haz clic en la matriz para añadir o eliminar enlaces."
                    : "Click on the matrix to add or delete links."}
                </div>
              )}
              <svg
                ref={svgRef}
                className="absolute w-full h-full z-0 pointer-events-none"
              >
                {redrawCounter > -1 &&
                  relations.map(([i, j], idx) => {
                    const { x1, y1, x2, y2 } = getLineCoords(i, j);
                    return (
                      <line
                        key={idx}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="black"
                        strokeWidth="2"
                        className="pointer-events-auto"
                        onClick={() => toggleRelation(i, j)}
                      />
                    );
                  })}
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-16 justify-center items-start mt-8">
          <div className="inline-block">
            <h3 className="font-semibold mb-2 text-center">
              {t.relationMatrix}
            </h3>
            <table className="border border-gray-300">
              <thead>
                <tr>
                  <th></th>
                  {rightSet.map((e, j) => (
                    <th key={j}>{e}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leftSet.map((le, i) => (
                  <tr key={i}>
                    <td>{le}</td>
                    {rightSet.map((re, j) => (
                      <td
                        key={j}
                        className="w-8 h-8 text-center border cursor-pointer"
                        onClick={() => toggleRelation(i, j)}
                      >
                        {relations.some(([x, y]) => x === i && y === j)
                          ? "✔️"
                          : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="min-w-[200px] text-center">
            <h3 className="font-semibold mb-2">{t.pairsArrow}</h3>
            <ul className="list-none">
              {relations.map(([i, j], idx) => (
                <li key={idx}>
                  {leftSet[i]}{" "}
                  {relationType === "relation"
                    ? t.pairsListRelation
                    : t.pairsListFunction}{" "}
                  {rightSet[j]}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border border-gray-300 shadow-sm rounded-lg">
          <div className="p-4">
            <div className="text-base whitespace-pre-wrap space-y-2">
              {relationType === "relation" ? (
                <p>{t.explanation.relation}</p>
              ) : (
                <>
                  <p>{t.explanation.function}</p>
                  {total && isFunction && <p>{t.explanation.totalFunction}</p>}
                  {(relationType === "surjective" ||
                    relationType === "bijective") && (
                    <p>{t.explanation.surjective}</p>
                  )}
                  {relationType === "bijective" && (
                    <p>{t.explanation.bijective}</p>
                  )}
                  {relationType === "injective" ||
                  relationType === "bijective" ? (
                    <p>
                      {lang === "es"
                        ? "Una función inyectiva asigna elementos distintos de A a elementos distintos de B."
                        : "An injective function assigns distinct elements of A to distinct elements of B."}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

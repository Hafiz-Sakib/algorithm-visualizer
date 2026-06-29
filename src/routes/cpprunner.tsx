import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controls } from "../components/viz/Controls";

export const Route = createFileRoute("/cpprunner")({
  head: () => ({
    meta: [
      { title: "C++ Runner — AlgoViz" },
      {
        name: "description",
        content:
          "Step through C++ snippets line by line — arithmetic, if/else, and loops — watching variables update and output appear in real time.",
      },
    ],
  }),
  component: CppRunnerPage,
});

/* ====================================================================== */
/* A tiny tracing interpreter for a teaching subset of C++                */
/* Supported: int/double/long/float/bool/string/char/auto declarations,  */
/* assignment & compound assignment, ++/--, arithmetic (+ - * / %),       */
/* comparison & logical ops, if / else if / else, for, while, do-while,   */
/* nested blocks, cout << ... << endl, and string concatenation.          */
/* It records one step per executed statement: { line, vars, output }.    */
/* ====================================================================== */

type Val = number | string | boolean;
type Scope = Record<string, Val>;
type Step = { line: number; vars: Scope; output: string; note: string };

type Tok = { t: string; v: string; line: number };

// ---- Tokenizer --------------------------------------------------------
function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let line = 1;
  let i = 0;
  const two = ["==", "!=", "<=", ">=", "&&", "||", "+=", "-=", "*=", "/=", "%=", "++", "--", "<<", ">>"];
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\n") { line++; i++; continue; }
    if (ch === " " || ch === "\t" || ch === "\r") { i++; continue; }
    // line comment
    if (ch === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (ch === "/" && src[i + 1] === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) { if (src[i] === "\n") line++; i++; } i += 2; continue; }
    // string literal
    if (ch === '"') {
      let s = ""; i++;
      while (i < src.length && src[i] !== '"') { if (src[i] === "\\") { const n = src[i + 1]; s += n === "n" ? "\n" : n === "t" ? "\t" : n; i += 2; } else s += src[i++]; }
      i++; toks.push({ t: "str", v: s, line }); continue;
    }
    // char literal
    if (ch === "'") {
      let s = ""; i++;
      while (i < src.length && src[i] !== "'") { if (src[i] === "\\") { const n = src[i + 1]; s += n === "n" ? "\n" : n === "t" ? "\t" : n; i += 2; } else s += src[i++]; }
      i++; toks.push({ t: "str", v: s, line }); continue;
    }
    // number
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      let n = ""; while (i < src.length && /[0-9.]/.test(src[i])) n += src[i++];
      toks.push({ t: "num", v: n, line }); continue;
    }
    // identifier / keyword
    if (/[A-Za-z_]/.test(ch)) {
      let id = ""; while (i < src.length && /[A-Za-z0-9_]/.test(src[i])) id += src[i++];
      toks.push({ t: "id", v: id, line }); continue;
    }
    // two-char operators
    const pair = src.slice(i, i + 2);
    if (two.includes(pair)) { toks.push({ t: "op", v: pair, line }); i += 2; continue; }
    // single char
    toks.push({ t: "op", v: ch, line }); i++;
  }
  toks.push({ t: "eof", v: "", line });
  return toks;
}

// ---- Parser (statements + expressions) --------------------------------
type Expr =
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "bool"; v: boolean }
  | { k: "var"; name: string }
  | { k: "un"; op: string; e: Expr }
  | { k: "bin"; op: string; a: Expr; b: Expr };

type Stmt =
  | { k: "decl"; type: string; name: string; init?: Expr; line: number }
  | { k: "assign"; name: string; op: string; e: Expr; line: number }
  | { k: "incdec"; name: string; op: string; line: number }
  | { k: "cout"; parts: (Expr | { endl: true })[]; line: number }
  | { k: "if"; cond: Expr; then: Stmt[]; elifs: { cond: Expr; body: Stmt[] }[]; els?: Stmt[]; line: number }
  | { k: "for"; init?: Stmt; cond?: Expr; post?: Stmt; body: Stmt[]; line: number }
  | { k: "while"; cond: Expr; body: Stmt[]; line: number }
  | { k: "dowhile"; cond: Expr; body: Stmt[]; line: number; condLine: number };

class Parser {
  toks: Tok[]; p = 0;
  constructor(toks: Tok[]) { this.toks = toks; }
  peek() { return this.toks[this.p]; }
  next() { return this.toks[this.p++]; }
  eat(v: string) { const t = this.toks[this.p]; if (t.v !== v) throw new Error(`Expected '${v}' but got '${t.v}' (line ${t.line})`); this.p++; return t; }
  is(v: string) { return this.toks[this.p]?.v === v; }
  static TYPES = new Set(["int", "double", "float", "long", "bool", "string", "char", "auto", "unsigned"]);

  parseProgram(): Stmt[] {
    // Skip past the body of main() if present; otherwise parse top-level.
    // We find the first '{' that opens main and parse until its matching '}'.
    // Simplest robust approach: strip everything outside the outermost { } of main.
    const stmts: Stmt[] = [];
    // find 'int main' ... '{'
    let started = false;
    for (let q = 0; q < this.toks.length; q++) {
      if (this.toks[q].v === "main" && this.toks[q + 1]?.v === "(") {
        // advance to the '{' after ')'
        let r = q;
        while (r < this.toks.length && this.toks[r].v !== "{") r++;
        this.p = r + 1;
        started = true;
        break;
      }
    }
    if (!started) {
      // no main: skip includes/using, then parse from first statement
      // jump past lines starting with # or 'using'
      this.p = 0;
      while (!this.is("eof")) {
        if (this.is("#")) { const ln = this.peek().line; while (!this.is("eof") && this.peek().line === ln) this.next(); continue; }
        if (this.is("using")) { while (!this.is("eof") && !this.is(";")) this.next(); if (this.is(";")) this.next(); continue; }
        break;
      }
      while (!this.is("eof")) stmts.push(this.parseStmt());
      return stmts;
    }
    while (!this.is("}") && !this.is("eof")) {
      // skip 'return ...;'
      if (this.is("return")) { while (!this.is(";") && !this.is("eof")) this.next(); if (this.is(";")) this.next(); continue; }
      stmts.push(this.parseStmt());
    }
    return stmts;
  }

  parseBlock(): Stmt[] {
    if (this.is("{")) {
      this.eat("{");
      const out: Stmt[] = [];
      while (!this.is("}") && !this.is("eof")) {
        if (this.is("return")) { while (!this.is(";") && !this.is("eof")) this.next(); if (this.is(";")) this.next(); continue; }
        out.push(this.parseStmt());
      }
      this.eat("}");
      return out;
    }
    return [this.parseStmt()];
  }

  parseStmt(): Stmt {
    const t = this.peek();
    const line = t.line;
    if (t.v === "if") return this.parseIf();
    if (t.v === "for") return this.parseFor();
    if (t.v === "while") return this.parseWhile();
    if (t.v === "do") return this.parseDoWhile();
    if (t.v === "cout") return this.parseCout();
    if (Parser.TYPES.has(t.v)) return this.parseDecl();
    // assignment / inc-dec
    if (t.t === "id") {
      const name = t.v;
      const nx = this.toks[this.p + 1];
      if (nx && (nx.v === "++" || nx.v === "--")) { this.next(); this.next(); if (this.is(";")) this.eat(";"); return { k: "incdec", name, op: nx.v, line }; }
      if (nx && ["=", "+=", "-=", "*=", "/=", "%="].includes(nx.v)) { this.next(); const op = this.next().v; const e = this.parseExpr(); if (this.is(";")) this.eat(";"); return { k: "assign", name, op, e, line }; }
    }
    // prefix ++x
    if (t.v === "++" || t.v === "--") { this.next(); const name = this.next().v; if (this.is(";")) this.eat(";"); return { k: "incdec", name, op: t.v, line }; }
    // fallback: consume to semicolon as no-op assignment to nothing
    while (!this.is(";") && !this.is("eof") && !this.is("}")) this.next();
    if (this.is(";")) this.eat(";");
    return { k: "assign", name: "__noop", op: "=", e: { k: "num", v: 0 }, line };
  }

  parseDecl(): Stmt {
    const type = this.next().v;
    const line = this.peek().line;
    const name = this.next().v;
    let init: Expr | undefined;
    if (this.is("=")) { this.eat("="); init = this.parseExpr(); }
    if (this.is(";")) this.eat(";");
    return { k: "decl", type, name, init, line };
  }

  parseCout(): Stmt {
    const line = this.peek().line;
    this.eat("cout");
    const parts: (Expr | { endl: true })[] = [];
    while (this.is("<<")) {
      this.eat("<<");
      if (this.is("endl")) { this.next(); parts.push({ endl: true }); }
      else parts.push(this.parseExpr());
    }
    if (this.is(";")) this.eat(";");
    return { k: "cout", parts, line };
  }

  parseIf(): Stmt {
    const line = this.peek().line;
    this.eat("if"); this.eat("("); const cond = this.parseExpr(); this.eat(")");
    const then = this.parseBlock();
    const elifs: { cond: Expr; body: Stmt[] }[] = [];
    let els: Stmt[] | undefined;
    while (this.is("else")) {
      this.eat("else");
      if (this.is("if")) { this.eat("if"); this.eat("("); const c = this.parseExpr(); this.eat(")"); elifs.push({ cond: c, body: this.parseBlock() }); }
      else { els = this.parseBlock(); break; }
    }
    return { k: "if", cond, then, elifs, els, line };
  }

  parseFor(): Stmt {
    const line = this.peek().line;
    this.eat("for"); this.eat("(");
    let init: Stmt | undefined;
    if (!this.is(";")) init = this.parseStmt(); else this.eat(";");
    let cond: Expr | undefined;
    if (!this.is(";")) cond = this.parseExpr();
    this.eat(";");
    let post: Stmt | undefined;
    if (!this.is(")")) {
      const t = this.peek();
      if (t.t === "id") {
        const name = t.v; const nx = this.toks[this.p + 1];
        if (nx && (nx.v === "++" || nx.v === "--")) { this.next(); this.next(); post = { k: "incdec", name, op: nx.v, line: t.line }; }
        else if (nx && ["=", "+=", "-=", "*=", "/=", "%="].includes(nx.v)) { this.next(); const op = this.next().v; const e = this.parseExpr(); post = { k: "assign", name, op, e, line: t.line }; }
      } else if (t.v === "++" || t.v === "--") { this.next(); const name = this.next().v; post = { k: "incdec", name, op: t.v, line: t.line }; }
    }
    this.eat(")");
    const body = this.parseBlock();
    return { k: "for", init, cond, post, body, line };
  }

  parseWhile(): Stmt {
    const line = this.peek().line;
    this.eat("while"); this.eat("("); const cond = this.parseExpr(); this.eat(")");
    const body = this.parseBlock();
    return { k: "while", cond, body, line };
  }

  parseDoWhile(): Stmt {
    const line = this.peek().line;
    this.eat("do");
    const body = this.parseBlock();
    this.eat("while"); this.eat("(");
    const condLine = this.peek().line;
    const cond = this.parseExpr(); this.eat(")"); if (this.is(";")) this.eat(";");
    return { k: "dowhile", cond, body, line, condLine };
  }

  // Expression parser with precedence
  parseExpr(): Expr { return this.parseOr(); }
  parseOr(): Expr { let a = this.parseAnd(); while (this.is("||")) { this.eat("||"); a = { k: "bin", op: "||", a, b: this.parseAnd() }; } return a; }
  parseAnd(): Expr { let a = this.parseEq(); while (this.is("&&")) { this.eat("&&"); a = { k: "bin", op: "&&", a, b: this.parseEq() }; } return a; }
  parseEq(): Expr { let a = this.parseRel(); while (this.is("==") || this.is("!=")) { const op = this.next().v; a = { k: "bin", op, a, b: this.parseRel() }; } return a; }
  parseRel(): Expr { let a = this.parseAdd(); while (this.is("<") || this.is(">") || this.is("<=") || this.is(">=")) { const op = this.next().v; a = { k: "bin", op, a, b: this.parseAdd() }; } return a; }
  parseAdd(): Expr { let a = this.parseMul(); while (this.is("+") || this.is("-")) { const op = this.next().v; a = { k: "bin", op, a, b: this.parseMul() }; } return a; }
  parseMul(): Expr { let a = this.parseUnary(); while (this.is("*") || this.is("/") || this.is("%")) { const op = this.next().v; a = { k: "bin", op, a, b: this.parseUnary() }; } return a; }
  parseUnary(): Expr { if (this.is("!") || this.is("-") || this.is("+")) { const op = this.next().v; return { k: "un", op, e: this.parseUnary() }; } return this.parsePrimary(); }
  parsePrimary(): Expr {
    const t = this.peek();
    if (t.v === "(") { this.eat("("); const e = this.parseExpr(); this.eat(")"); return e; }
    if (t.t === "num") { this.next(); return { k: "num", v: parseFloat(t.v) }; }
    if (t.t === "str") { this.next(); return { k: "str", v: t.v }; }
    if (t.v === "true") { this.next(); return { k: "bool", v: true }; }
    if (t.v === "false") { this.next(); return { k: "bool", v: false }; }
    if (t.t === "id") { this.next(); return { k: "var", name: t.v }; }
    this.next();
    return { k: "num", v: 0 };
  }
}

// ---- Evaluator + tracer ----------------------------------------------
class Interpreter {
  vars: Scope = {};
  doubles = new Set<string>(); // names declared double/float
  out = "";
  steps: Step[] = [];
  budget = 20000; // guard against infinite loops

  isFloaty(e: Expr): boolean {
    if (e.k === "num") return !Number.isInteger(e.v);
    if (e.k === "var") return this.doubles.has(e.name);
    if (e.k === "un") return this.isFloaty(e.e);
    if (e.k === "bin") return this.isFloaty(e.a) || this.isFloaty(e.b);
    return false;
  }

  snap(line: number, note: string) {
    this.steps.push({ line, vars: { ...this.vars }, output: this.out, note });
    if (this.steps.length > 5000) throw new Error("Too many steps (is there an infinite loop?)");
  }

  evalE(e: Expr): Val {
    switch (e.k) {
      case "num": return e.v;
      case "str": return e.v;
      case "bool": return e.v;
      case "var": return this.vars[e.name] ?? 0;
      case "un": {
        const v = this.evalE(e.e);
        if (e.op === "-") return -(v as number);
        if (e.op === "+") return +(v as number);
        if (e.op === "!") return !truthy(v);
        return v;
      }
      case "bin": {
        if (e.op === "&&") return truthy(this.evalE(e.a)) && truthy(this.evalE(e.b));
        if (e.op === "||") return truthy(this.evalE(e.a)) || truthy(this.evalE(e.b));
        const a = this.evalE(e.a), b = this.evalE(e.b);
        if (e.op === "+") { if (typeof a === "string" || typeof b === "string") return String(disp(a)) + String(disp(b)); return (a as number) + (b as number); }
        if (e.op === "-") return (a as number) - (b as number);
        if (e.op === "*") return (a as number) * (b as number);
        if (e.op === "/") { const r = (a as number) / (b as number); return this.isFloaty(e.a) || this.isFloaty(e.b) ? r : Math.trunc(r); }
        if (e.op === "%") return (a as number) % (b as number);
        if (e.op === "==") return a === b;
        if (e.op === "!=") return a !== b;
        if (e.op === "<") return (a as number) < (b as number);
        if (e.op === ">") return (a as number) > (b as number);
        if (e.op === "<=") return (a as number) <= (b as number);
        if (e.op === ">=") return (a as number) >= (b as number);
        return 0;
      }
    }
  }

  run(stmts: Stmt[]) {
    for (const s of stmts) this.exec(s);
  }

  exec(s: Stmt) {
    if (--this.budget < 0) throw new Error("Execution budget exceeded (possible infinite loop).");
    switch (s.k) {
      case "decl": {
        const v = s.init !== undefined ? this.evalE(s.init) : (s.type === "string" || s.type === "char" ? "" : s.type === "bool" ? false : 0);
        if (s.type === "double" || s.type === "float") this.doubles.add(s.name);
        this.vars[s.name] = v;
        this.snap(s.line, `Declare ${s.name} = ${disp(v)}`);
        break;
      }
      case "assign": {
        if (s.name === "__noop") break;
        const rhs = this.evalE(s.e);
        const cur = this.vars[s.name] ?? 0;
        let nv: Val = rhs;
        if (s.op === "+=") nv = typeof cur === "string" || typeof rhs === "string" ? String(disp(cur)) + String(disp(rhs)) : (cur as number) + (rhs as number);
        else if (s.op === "-=") nv = (cur as number) - (rhs as number);
        else if (s.op === "*=") nv = (cur as number) * (rhs as number);
        else if (s.op === "/=") nv = (cur as number) / (rhs as number);
        else if (s.op === "%=") nv = (cur as number) % (rhs as number);
        this.vars[s.name] = nv;
        this.snap(s.line, `${s.name} = ${disp(nv)}`);
        break;
      }
      case "incdec": {
        const cur = (this.vars[s.name] as number) ?? 0;
        const nv = s.op === "++" ? cur + 1 : cur - 1;
        this.vars[s.name] = nv;
        this.snap(s.line, `${s.name} ${s.op} → ${nv}`);
        break;
      }
      case "cout": {
        let line = "";
        for (const part of s.parts) { if ("endl" in part) line += "\n"; else line += String(disp(this.evalE(part))); }
        this.out += line;
        this.snap(s.line, `Print output`);
        break;
      }
      case "if": {
        if (truthy(this.evalE(s.cond))) { this.snap(s.line, `Condition true → enter if`); this.run(s.then); break; }
        let handled = false;
        for (const e of s.elifs) { if (truthy(this.evalE(e.cond))) { this.snap(s.line, `else-if true`); this.run(e.body); handled = true; break; } }
        if (!handled && s.els) { this.snap(s.line, `All false → else`); this.run(s.els); }
        else if (!handled) this.snap(s.line, `Condition false → skip`);
        break;
      }
      case "for": {
        if (s.init) this.exec(s.init);
        while (!s.cond || truthy(this.evalE(s.cond))) {
          this.snap(s.line, `Loop check → enter body`);
          this.run(s.body);
          if (s.post) this.exec(s.post);
          if (--this.budget < 0) throw new Error("Execution budget exceeded (possible infinite loop).");
        }
        this.snap(s.line, `Loop condition false → exit`);
        break;
      }
      case "while": {
        while (truthy(this.evalE(s.cond))) {
          this.snap(s.line, `while true → body`);
          this.run(s.body);
          if (--this.budget < 0) throw new Error("Execution budget exceeded (possible infinite loop).");
        }
        this.snap(s.line, `while false → exit`);
        break;
      }
      case "dowhile": {
        do {
          this.snap(s.line, `do → body`);
          this.run(s.body);
          if (--this.budget < 0) throw new Error("Execution budget exceeded (possible infinite loop).");
        } while (truthy(this.evalE(s.cond)));
        this.snap(s.condLine, `while false → exit`);
        break;
      }
    }
  }
}

function truthy(v: Val): boolean { if (typeof v === "boolean") return v; if (typeof v === "number") return v !== 0; return v !== ""; }
function disp(v: Val): string { if (typeof v === "boolean") return v ? "1" : "0"; if (typeof v === "number") { return Number.isInteger(v) ? String(v) : String(+v.toFixed(6)); } return v; }

function trace(src: string): { steps: Step[]; error?: string } {
  try {
    const toks = tokenize(src);
    const stmts = new Parser(toks).parseProgram();
    const interp = new Interpreter();
    interp.steps.push({ line: -1, vars: {}, output: "", note: "Program start" });
    interp.run(stmts);
    interp.snap(-2, "Program finished");
    return { steps: interp.steps };
  } catch (e) {
    return { steps: [{ line: -1, vars: {}, output: "", note: "Error" }], error: (e as Error).message };
  }
}

/* ====================================================================== */
/* Example programs                                                       */
/* ====================================================================== */

const EXAMPLES: { name: string; code: string }[] = [
  {
    name: "Arithmetic",
    code: `#include <iostream>
using namespace std;

int main() {
    int a = 12;
    int b = 5;
    int sum = a + b;
    int diff = a - b;
    int prod = a * b;
    int quot = a / b;
    int rem = a % b;
    cout << "sum  = " << sum << endl;
    cout << "diff = " << diff << endl;
    cout << "prod = " << prod << endl;
    cout << "quot = " << quot << endl;
    cout << "rem  = " << rem << endl;
    return 0;
}`,
  },
  {
    name: "If / Else",
    code: `#include <iostream>
using namespace std;

int main() {
    int score = 76;
    if (score >= 90) {
        cout << "Grade A" << endl;
    } else if (score >= 75) {
        cout << "Grade B" << endl;
    } else if (score >= 60) {
        cout << "Grade C" << endl;
    } else {
        cout << "Fail" << endl;
    }
    return 0;
}`,
  },
  {
    name: "For loop",
    code: `#include <iostream>
using namespace std;

int main() {
    int sum = 0;
    for (int i = 1; i <= 5; i++) {
        sum += i;
        cout << "i=" << i << " sum=" << sum << endl;
    }
    cout << "Total = " << sum << endl;
    return 0;
}`,
  },
  {
    name: "While loop",
    code: `#include <iostream>
using namespace std;

int main() {
    int n = 16;
    int steps = 0;
    while (n > 1) {
        if (n % 2 == 0) {
            n = n / 2;
        } else {
            n = 3 * n + 1;
        }
        steps++;
        cout << "n=" << n << endl;
    }
    cout << "Collatz steps = " << steps << endl;
    return 0;
}`,
  },
  {
    name: "Nested loops",
    code: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 3; i++) {
        for (int j = 1; j <= 3; j++) {
            cout << i * j << " ";
        }
        cout << endl;
    }
    return 0;
}`,
  },
];

const ACCENT = "oklch(0.72 0.19 255)";
const panel: React.CSSProperties = { background: "oklch(0.12 0.025 265)", border: "1px solid oklch(1 0 0 / 8%)" };

/* ====================================================================== */
/* Page                                                                   */
/* ====================================================================== */

function CppRunnerPage() {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [activeEx, setActiveEx] = useState(0);
  const [speed, setSpeed] = useState(55);

  const result = useMemo(() => trace(code), [code]);
  const steps = result.steps;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => { setIndex(0); setPlaying(false); }, [code]);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setIndex((i) => { if (i >= steps.length - 1) { setPlaying(false); return i; } return i + 1; });
    }, Math.max(120, 1200 - speed * 10));
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [playing, speed, steps.length]);

  const onPlay = useCallback(() => { setIndex((i) => (i >= steps.length - 1 ? 0 : i)); setPlaying(true); }, [steps.length]);
  const onPause = useCallback(() => setPlaying(false), []);
  const onReset = useCallback(() => { setPlaying(false); setIndex(0); }, []);
  const onStepFwd = useCallback(() => setIndex((i) => Math.min(steps.length - 1, i + 1)), [steps.length]);
  const onStepBack = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  const cur = steps[Math.min(index, steps.length - 1)];
  const curLine = cur?.line ?? -1;
  const lines = code.split("\n");
  const codeRef = useRef<HTMLDivElement>(null);

  // auto-scroll executing line into view
  useEffect(() => {
    const el = codeRef.current?.querySelector(`[data-ln="${curLine}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [curLine]);

  const loadExample = (i: number) => { setActiveEx(i); setCode(EXAMPLES[i].code); };

  return (
    <div className="space-y-4 py-2">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-mono" style={{ color: ACCENT }}>{"{}"}</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>C++ Runner</h1>
          </div>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>Step through C++ line by line — arithmetic, if/else, and loops — and watch variables and output update live.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <button key={ex.name} onClick={() => loadExample(i)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: activeEx === i ? ACCENT : "oklch(1 0 0 / 6%)", color: activeEx === i ? "oklch(0.08 0.02 265)" : "oklch(0.65 0.04 255)", border: `1px solid ${activeEx === i ? ACCENT : "oklch(1 0 0 / 10%)"}` }}>
              {ex.name}
            </button>
          ))}
        </div>
      </header>

      {/* Editor + code-with-highlight, side by side on large screens */}
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {/* editable source */}
        <div className="rounded-2xl overflow-hidden" style={panel}>
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest flex items-center justify-between" style={{ color: "oklch(0.45 0.04 255)" }}>
            <span>source — editable</span>
            <button onClick={onReset} className="px-2 py-0.5 rounded text-[10px]" style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.6 0.04 255)" }}>reset run</button>
          </div>
          <textarea
            value={code}
            onChange={(e) => { setActiveEx(-1); setCode(e.target.value); }}
            spellCheck={false}
            className="w-full font-mono text-[12.5px] leading-relaxed p-3 outline-none resize-y"
            style={{ minHeight: 360, background: "oklch(0.07 0.015 265)", color: "oklch(0.82 0.03 255)", border: "none" }}
          />
        </div>

        {/* executing view with highlighted line */}
        <div className="rounded-2xl overflow-hidden" style={panel}>
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: "oklch(0.45 0.04 255)" }}>execution — current line highlighted</div>
          <div ref={codeRef} className="font-mono text-[12.5px] leading-relaxed p-3 overflow-auto" style={{ maxHeight: 400, background: "oklch(0.07 0.015 265)" }}>
            {lines.map((ln, idx) => {
              const lineNo = idx + 1;
              const running = lineNo === curLine;
              return (
                <div key={idx} data-ln={lineNo} className="flex items-start gap-3 rounded px-2 -mx-1 transition-colors" style={{ background: running ? `${ACCENT}26` : "transparent", boxShadow: running ? `inset 3px 0 0 ${ACCENT}` : "none" }}>
                  <span className="select-none w-6 text-right shrink-0" style={{ color: running ? ACCENT : "oklch(0.4 0.04 255)" }}>{lineNo}</span>
                  <span className="shrink-0 w-3" style={{ color: ACCENT }}>{running ? "▶" : ""}</span>
                  <span className="whitespace-pre" style={{ color: running ? "oklch(0.95 0.02 255)" : "oklch(0.7 0.03 255)" }}>{ln || " "}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Variables + output */}
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <div className="rounded-2xl p-4" style={panel}>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "oklch(0.45 0.04 255)" }}>variables</div>
          {result.error ? (
            <div className="text-sm" style={{ color: "var(--danger)" }}>{result.error}</div>
          ) : Object.keys(cur?.vars ?? {}).length === 0 ? (
            <div className="text-sm" style={{ color: "oklch(0.5 0.04 255)" }}>No variables yet.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {Object.entries(cur?.vars ?? {}).filter(([k]) => k !== "__noop").map(([k, v]) => (
                  <motion.div key={k} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-lg px-3 py-1.5 font-mono text-xs" style={{ background: "oklch(1 0 0 / 5%)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                    <span style={{ color: ACCENT }}>{k}</span>
                    <span style={{ color: "oklch(0.5 0.04 255)" }}> = </span>
                    <span style={{ color: "oklch(0.9 0.02 255)" }}>{disp(v)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          {!result.error && cur?.note && (
            <div className="mt-3 text-xs rounded-lg px-3 py-2" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, color: "oklch(0.8 0.02 255)" }}>{cur.note}</div>
          )}
        </div>

        <div className="rounded-2xl p-4" style={panel}>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "oklch(0.45 0.04 255)" }}>stdout (cout)</div>
          <pre className="font-mono text-[12.5px] leading-relaxed rounded-lg p-3 overflow-auto whitespace-pre-wrap" style={{ minHeight: 120, maxHeight: 220, background: "oklch(0.07 0.015 265)", color: "oklch(0.85 0.18 162)" }}>{cur?.output || ""}<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.9 }} style={{ color: ACCENT }}>▌</motion.span></pre>
        </div>
      </div>

      <Controls
        playing={playing}
        onPlay={onPlay}
        onPause={onPause}
        onReset={onReset}
        onStepBack={onStepBack}
        onStepFwd={onStepFwd}
        speed={speed}
        setSpeed={setSpeed}
        index={index}
        total={steps.length}
      />

      <p className="text-[11px]" style={{ color: "oklch(0.42 0.04 255)" }}>
        Note: this is a lightweight teaching interpreter for a subset of C++ (variables, arithmetic, if/else, for/while/do-while, cout). It is not a full compiler — features like functions, arrays, pointers, and the STL aren't supported.
      </p>
    </div>
  );
}

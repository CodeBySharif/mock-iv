export function speakText(
  text: string,
  options?: {
    role?: "hr" | "technical";
    onEnd?: () => void;
    onError?: () => void;
  },
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    options?.onError?.();
    return () => undefined;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    const preferred =
      options?.role === "hr"
        ? voices.find((v) => /female|samantha|google us english/i.test(v.name))
        : voices.find((v) => /male|david|google uk english male/i.test(v.name));
    utterance.voice = preferred ?? voices[0];
  }
  utterance.rate = options?.role === "hr" ? 1 : 0.95;
  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = () => options?.onError?.();
  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  grammars?: unknown;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence?: number };
  }>;
};

function getRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isSpeechRecognitionSupported() {
  return !!getRecognitionCtor();
}

/** Normalize common tech terms the Web Speech API mishears. */
export function normalizeTranscript(raw: string) {
  let text = raw;
  const replacements: Array<[RegExp, string]> = [
    [/\bdot\s*net\b/gi, ".NET"],
    [/\bd(?:ot)?\s*net\s*core\b/gi, ".NET Core"],
    [/\bc\s*sharp\b/gi, "C#"],
    [/\bc\s*plus\s*plus\b/gi, "C++"],
    [/\bnode\s*js\b/gi, "Node.js"],
    [/\breact\s*js\b/gi, "React"],
    [/\bnext\s*js\b/gi, "Next.js"],
    [/\btype\s*script\b/gi, "TypeScript"],
    [/\bjava\s*script\b/gi, "JavaScript"],
    [/\bvs\s*code\b/gi, "VS Code"],
    [/\bsql\s*server\b/gi, "SQL Server"],
    [/\bpostgre\s*sql\b/gi, "PostgreSQL"],
    [/\bmongo\s*db\b/gi, "MongoDB"],
    [/\bentity\s*framework\b/gi, "Entity Framework"],
    [/\basp\s*dot\s*net\b/gi, "ASP.NET"],
    [/\bweb\s*api\b/gi, "Web API"],
    [/\bci\s*cd\b/gi, "CI/CD"],
    [/\bgit\s*hub\b/gi, "GitHub"],
  ];
  for (const [pattern, value] of replacements) {
    text = text.replace(pattern, value);
  }
  return text.replace(/\s+/g, " ").trim();
}

export function createRecognition(handlers: {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
  /** When true, restart after Chrome stops on silence (keeps listening). */
  autoRestart?: boolean;
}) {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.maxAlternatives = 3;

  // Bias toward common stack terms when the engine supports grammars.
  try {
    const w = window as Window & {
      SpeechGrammarList?: new () => {
        addFromString: (s: string, weight?: number) => void;
      };
      webkitSpeechGrammarList?: new () => {
        addFromString: (s: string, weight?: number) => void;
      };
    };
    const GrammarCtor = w.SpeechGrammarList ?? w.webkitSpeechGrammarList;
    if (GrammarCtor) {
      const list = new GrammarCtor();
      list.addFromString(
        "#JSGF V1.0; grammar tech; public <tech> = .NET | C# | TypeScript | JavaScript | React | Node.js | ASP.NET | Entity Framework | SQL Server | PostgreSQL | MongoDB | GitHub | CI/CD ;",
        1,
      );
      recognition.grammars = list;
    }
  } catch {
    // Grammar list is optional / unsupported in some browsers.
  }

  let intentionalStop = false;

  recognition.onresult = (event) => {
    let interim = "";
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const piece = result[0]?.transcript ?? "";
      if (result.isFinal) finalText += `${piece} `;
      else interim += piece;
    }
    if (finalText) {
      handlers.onResult(normalizeTranscript(finalText), true);
    }
    if (interim) {
      handlers.onResult(normalizeTranscript(interim), false);
    }
  };
  recognition.onerror = (event) => {
    // no-speech / aborted are normal while waiting; keep listening if possible.
    if (event.error === "no-speech" || event.error === "aborted") return;
    handlers.onError?.(event.error);
  };
  recognition.onend = () => {
    handlers.onEnd?.();
    if (!intentionalStop && handlers.autoRestart !== false) {
      try {
        recognition.start();
      } catch {
        // Already started or not allowed.
      }
    }
  };

  const originalStop = recognition.stop.bind(recognition);
  const originalAbort = recognition.abort.bind(recognition);
  recognition.stop = () => {
    intentionalStop = true;
    originalStop();
  };
  recognition.abort = () => {
    intentionalStop = true;
    originalAbort();
  };

  return recognition;
}

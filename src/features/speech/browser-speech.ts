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
    0: { transcript: string };
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

export function createRecognition(handlers: {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}) {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    let interim = "";
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const piece = result[0]?.transcript ?? "";
      if (result.isFinal) finalText += `${piece} `;
      else interim += piece;
    }
    if (finalText) handlers.onResult(finalText.trim(), true);
    if (interim) handlers.onResult(interim.trim(), false);
  };
  recognition.onerror = (event) => {
    handlers.onError?.(event.error);
  };
  recognition.onend = () => handlers.onEnd?.();

  return recognition;
}

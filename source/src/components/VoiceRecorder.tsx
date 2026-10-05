import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Check, AlertCircle, Play, VolumeX } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string) => void;
  onClose?: () => void;
  autoAnalyze?: boolean;
  onAutoAnalyzeChange?: (auto: boolean) => void;
}

// Realistic test cases for teachers to test voice conversion with 1 click
const SAMPLE_TEST_CASES = [
  {
    title: '퇴근 후 야간 전화 & 방문 예고',
    text: '어젯밤 9시 20분에 1학년 3반 김철수 학부모한테 전화가 왔는데, 수행평가 점수 올려달라고 소리치면서 내일 교무실로 찾아오겠다고 했습니다.',
  },
  {
    title: '성적 이의 & 맘카페 유포 협박',
    text: '오늘 방과후 박영희 학부모가 전화로 이번 감점 취소 안 해주면 맘카페랑 교육청에 민원 넣고 교사 가만 안 두겠다고 폭언했습니다.',
  },
  {
    title: '평일 일상 상담 문의 (안전)',
    text: '오늘 2교시 후 이민준 학생이 미술 준비물 관련해서 교무실로 문의하러 와서 공식 안내서 전달하고 지도했습니다.',
  },
];

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptComplete,
  onClose,
  autoAnalyze = true,
  onAutoAnalyzeChange,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(16).fill(15));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);

  const recognitionRef = useRef<any>(null);
  const userManuallyStoppedRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWave = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const bars: number[] = [];
        const step = Math.floor(dataArray.length / 16) || 1;
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.max(12, Math.min(85, Math.round((val / 255) * 85))));
        }
        setAudioLevel(bars);
        animFrameRef.current = requestAnimationFrame(updateWave);
      };
      updateWave();
    } catch {
      // Fallback synthetic wave animation if microphone audio analyzer is restricted
      const interval = setInterval(() => {
        setAudioLevel((prev) =>
          prev.map(() => Math.floor(Math.random() * 45) + 15)
        );
      }, 100);
      animFrameRef.current = interval;
    }
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) {
      if (typeof animFrameRef.current === 'number') {
        cancelAnimationFrame(animFrameRef.current);
      } else {
        clearInterval(animFrameRef.current);
      }
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(new Array(16).fill(15));
  };

  const startRecording = () => {
    setErrorMessage(null);
    setInterimTranscript('');
    setFinalTranscript('');
    setIsSimulating(false);
    userManuallyStoppedRef.current = false;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        '현재 브라우저 환경에서 Web Speech API 마이크 인식을 지원하지 않습니다. Chrome 브라우저를 권장하며, 아래 샘플 음성으로 즉시 테스트해보실 수 있습니다.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        startAudioVisualizer();
      };

      recognition.onresult = (event: any) => {
        let finalAcc = '';
        let interimAcc = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalAcc += res[0].transcript + ' ';
          } else {
            interimAcc += res[0].transcript;
          }
        }

        if (finalAcc) {
          setFinalTranscript(finalAcc.trim());
        }
        setInterimTranscript(interimAcc.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning/error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            '마이크 사용 권한이 차단되어 있습니다. 브라우저 주소창 왼쪽 자물쇠/설정 아이콘에서 마이크 권한을 허용해 주세요.'
          );
          userManuallyStoppedRef.current = true;
          stopRecording();
        } else if (event.error === 'no-speech') {
          // Keep listening or prompt
        } else {
          setErrorMessage(`음성 인식 알림 (${event.error})`);
        }
      };

      recognition.onend = () => {
        // If not manually stopped, attempt auto-restart on mobile browsers that drop recognition
        if (!userManuallyStoppedRef.current && isRecording) {
          try {
            recognition.start();
            return;
          } catch {
            // ignore
          }
        }
        setIsRecording(false);
        stopAudioVisualizer();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setErrorMessage(`음성 인식 시작 실패: ${e?.message || '마이크 권한을 확인하세요'}`);
      stopRecording();
    }
  };

  const stopRecording = () => {
    userManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    stopAudioVisualizer();
  };

  const handleApply = (textToApply?: string) => {
    const text = (textToApply || finalTranscript || interimTranscript).trim();
    if (text) {
      onTranscriptComplete(text);
      if (onClose) onClose();
    }
  };

  const simulateSpeech = (sampleText: string) => {
    stopRecording();
    setIsSimulating(true);
    setErrorMessage(null);
    setFinalTranscript('');
    setInterimTranscript('음성 듣는 중...');

    // Also speak it with TTS if available
    speakText(sampleText);

    let current = '';
    const words = sampleText.split(' ');
    let idx = 0;

    const timer = setInterval(() => {
      if (idx < words.length) {
        current += (current ? ' ' : '') + words[idx];
        setFinalTranscript(current);
        setInterimTranscript('');
        idx++;
      } else {
        clearInterval(timer);
        setIsSimulating(false);
      }
    }, 150);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsTtsPlaying(true);
      utterance.onend = () => setIsTtsPlaying(false);
      utterance.onerror = () => setIsTtsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsTtsPlaying(false);
    }
  };

  const stopTts = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
    }
  };

  const fullText = (finalTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim();

  return (
    <div className="bg-white border border-[#D9DEE4] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isRecording
                ? 'bg-red-50 text-red-600 animate-pulse'
                : 'bg-[#E3F3EF] text-[#0E6B5C]'
            }`}
          >
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              실시간 음성 메모 받아쓰기 (STT)
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              {isRecording
                ? '목소리를 듣고 실시간 텍스트로 변환 중입니다...'
                : isSimulating
                ? '샘플 음성 데이터를 입력 및 낭독 중입니다...'
                : '마이크 버튼을 누르고 말씀하시면 실시간 텍스트로 기록됩니다'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded transition-colors shrink-0"
          >
            닫기
          </button>
        )}
      </div>

      {/* Visual Audio Waveform */}
      <div className="bg-slate-50 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center min-h-[80px] sm:min-h-[90px] border border-slate-100 relative overflow-hidden">
        {isRecording ? (
          <div className="flex items-end gap-1.5 h-12 sm:h-14">
            {audioLevel.map((height, i) => (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className="w-1.5 sm:w-2 bg-[#0E6B5C] rounded-full transition-all duration-75"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-1 sm:py-2">
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 mx-auto mb-1" />
            <span className="text-[11px] sm:text-xs text-slate-400">마이크 대기 상태</span>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-ping" />
            실시간 음성 청취 중
          </div>
        )}
      </div>

      {/* Live Transcript Display Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 min-h-[80px] max-h-[130px] overflow-y-auto text-xs sm:text-sm text-slate-800 leading-relaxed">
        {fullText ? (
          <div>
            <span>{finalTranscript}</span>
            {interimTranscript && (
              <span className="text-slate-400 italic bg-amber-50 px-1 rounded ml-1 animate-pulse">
                {interimTranscript}
              </span>
            )}
          </div>
        ) : (
          <p className="text-slate-400 text-xs italic">
            {isRecording
              ? '말씀하시면 이곳에 즉시 문장이 나타납니다. (예: "오늘 김철수 학부모가 전화로...")'
              : '아직 인식된 음성이 없습니다. [음성 녹음 시작]을 누르거나 아래 빠른 테스트 샘플을 클릭하세요.'}
          </p>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#0E6B5C] hover:bg-[#0A5448] text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              음성 녹음 시작
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all animate-pulse cursor-pointer"
            >
              <MicOff className="w-3.5 h-3.5" />
              녹음 종료
            </button>
          )}

          {fullText && (
            <button
              onClick={() => handleApply(fullText)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              입력창 반영 ({fullText.length}자)
            </button>
          )}

          {isTtsPlaying && (
            <button
              onClick={stopTts}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition-colors cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5 text-red-500" />
              음성 중지
            </button>
          )}
        </div>

        {onAutoAnalyzeChange && (
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => onAutoAnalyzeChange(e.target.checked)}
              className="rounded text-[#0E6B5C] focus:ring-[#0E6B5C] accent-[#0E6B5C]"
            />
            <span>입력 후 Agent 즉시 분석</span>
          </label>
        )}
      </div>

      {/* Instant Test Samples for Simulation */}
      <div className="border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#0E6B5C]" />
            빠른 음성 테스트 샘플 (클릭 시 1초 음성 시뮬레이션):
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_TEST_CASES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => simulateSpeech(sample.text)}
              disabled={isSimulating || isRecording}
              className="text-left p-2 sm:p-2.5 rounded-lg border border-slate-200 hover:border-[#0E6B5C] hover:bg-[#E3F3EF]/30 bg-slate-50/50 text-xs text-slate-700 transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Play className="w-2.5 h-2.5 text-[#0E6B5C] shrink-0" />
                <span className="truncate">{sample.title}</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{sample.text}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

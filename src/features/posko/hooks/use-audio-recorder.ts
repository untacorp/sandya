"use client";

import * as React from "react";
import { TIME_CONSTANTS } from "@/core/shared/constants";

export interface AudioRecordingResult {
  audioBase64: string;
  durationMs: number;
  waveform: number[];
}

export const AUDIO_RECORDER_CONSTANTS = {
  MAX_RECORDING_SECONDS: 5,
  SAMPLE_INTERVAL_MS: 100,
  WAVEFORM_BARS_COUNT: 10,
  DEFAULT_WAVEFORM: [25, 40, 65, 85, 90, 75, 60, 45, 30, 15] as const,
  MIN_BAR_LEVEL: 15,
  MAX_BAR_LEVEL: 100,
} as const;

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const [hasPermissionError, setHasPermissionError] = React.useState(false);
  const [currentWaveform, setCurrentWaveform] = React.useState<number[]>(
    [...AUDIO_RECORDER_CONSTANTS.DEFAULT_WAVEFORM]
  );

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const startTimeRef = React.useRef<number>(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const analyserIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const waveformSamplesRef = React.useRef<number[]>([]);

  const cleanupStream = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (analyserIntervalRef.current) {
      clearInterval(analyserIntervalRef.current);
      analyserIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignored
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  React.useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  const startRecording = React.useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setHasPermissionError(true);
      return false;
    }

    try {
      cleanupStream();
      setHasPermissionError(false);
      chunksRef.current = [];
      waveformSamplesRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // AudioContext for live waveform extraction
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyserIntervalRef.current = setInterval(() => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] || 0;
              }
              const avg = Math.min(
                AUDIO_RECORDER_CONSTANTS.MAX_BAR_LEVEL,
                Math.max(AUDIO_RECORDER_CONSTANTS.MIN_BAR_LEVEL, Math.round((sum / dataArray.length) * 1.5))
              );
              waveformSamplesRef.current.push(avg);

              // Live 10 bars preview
              const recentSamples = waveformSamplesRef.current.slice(-AUDIO_RECORDER_CONSTANTS.WAVEFORM_BARS_COUNT);
              while (recentSamples.length < AUDIO_RECORDER_CONSTANTS.WAVEFORM_BARS_COUNT) {
                recentSamples.unshift(AUDIO_RECORDER_CONSTANTS.MIN_BAR_LEVEL);
              }
              setCurrentWaveform(recentSamples);
            }
          }, AUDIO_RECORDER_CONSTANTS.SAMPLE_INTERVAL_MS);
        }
      } catch {
        // Fallback if AudioContext is blocked
      }

      // MediaRecorder MIME type detection
      let mimeType = "audio/webm";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      recorder.start(100);

      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= AUDIO_RECORDER_CONSTANTS.MAX_RECORDING_SECONDS) {
            return AUDIO_RECORDER_CONSTANTS.MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, TIME_CONSTANTS.MS_PER_SECOND);

      return true;
    } catch {
      setHasPermissionError(true);
      setIsRecording(false);
      return false;
    }
  }, [cleanupStream]);

  const stopRecording = React.useCallback(async (): Promise<AudioRecordingResult | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cleanupStream();
      setIsRecording(false);
      return null;
    }

    const durationMs = Math.min(
      AUDIO_RECORDER_CONSTANTS.MAX_RECORDING_SECONDS * TIME_CONSTANTS.MS_PER_SECOND,
      Math.max(500, Date.now() - startTimeRef.current)
    );

    return new Promise<AudioRecordingResult | null>((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        // Calculate final 10-bar waveform summary
        const samples = waveformSamplesRef.current;
        const finalWaveform: number[] = [];
        const step = Math.max(1, Math.floor(samples.length / AUDIO_RECORDER_CONSTANTS.WAVEFORM_BARS_COUNT));
        for (let i = 0; i < AUDIO_RECORDER_CONSTANTS.WAVEFORM_BARS_COUNT; i++) {
          const chunk = samples.slice(i * step, (i + 1) * step);
          const avg = chunk.length > 0
            ? Math.round(chunk.reduce((a, b) => a + b, 0) / chunk.length)
            : AUDIO_RECORDER_CONSTANTS.DEFAULT_WAVEFORM[i] || 25;
          finalWaveform.push(avg);
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          cleanupStream();
          setIsRecording(false);
          setRecordingSeconds(0);
          resolve({
            audioBase64: base64data,
            durationMs,
            waveform: finalWaveform.length === 10 ? finalWaveform : [...AUDIO_RECORDER_CONSTANTS.DEFAULT_WAVEFORM],
          });
        };
        reader.onerror = () => {
          cleanupStream();
          setIsRecording(false);
          setRecordingSeconds(0);
          resolve(null);
        };
        reader.readAsDataURL(audioBlob);
      };

      try {
        recorder.stop();
      } catch {
        cleanupStream();
        setIsRecording(false);
        resolve(null);
      }
    });
  }, [cleanupStream]);

  const cancelRecording = React.useCallback(() => {
    cleanupStream();
    setIsRecording(false);
    setRecordingSeconds(0);
    chunksRef.current = [];
  }, [cleanupStream]);

  return {
    isRecording,
    recordingSeconds,
    hasPermissionError,
    currentWaveform,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

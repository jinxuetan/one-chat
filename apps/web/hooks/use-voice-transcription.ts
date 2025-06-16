"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useApiKeys } from "./use-api-keys";

interface TranscriptionCallbacks {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface TranscriptionState {
  isRecording: boolean;
  isConnecting: boolean;
  error: string | null;
  hasPermission: boolean;
}

const AUDIO_CONFIG = {
  sampleRate: 24000,
  bufferSize: 16384, // ~32KB chunks
  connectionTimeout: 10000,
  websocketProtocols: ["realtime", "openai-beta.realtime-v1"],
} as const;

const WORKLET_PROCESSOR_CODE = `
  class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.bufferSize = ${AUDIO_CONFIG.bufferSize};
      this.audioBuffer = new Float32Array(this.bufferSize);
      this.bufferIndex = 0;
    }

    process(inputs) {
      const [input] = inputs;
      if (!input?.length) return true;

      const [channelData] = input;
      if (!channelData) return true;

      for (let i = 0; i < channelData.length; i++) {
        this.audioBuffer[this.bufferIndex++] = channelData[i];

        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage(this.convertToPCM16());
          this.bufferIndex = 0;
        }
      }

      return true;
    }

    convertToPCM16() {
      const pcm16 = new Int16Array(this.bufferSize);
      for (let i = 0; i < this.bufferSize; i++) {
        const sample = Math.max(-1, Math.min(1, this.audioBuffer[i]));
        pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      }
      return pcm16;
    }
  }

  registerProcessor('audio-processor', AudioProcessor);
`;

export const useVoiceTranscription = ({
  onTranscript,
  onError,
}: TranscriptionCallbacks = {}) => {
  const { keys } = useApiKeys();
  const [state, setState] = useState<TranscriptionState>({
    isRecording: false,
    isConnecting: false,
    error: null,
    hasPermission: false,
  });

  // Audio refs
  const websocketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<AudioWorkletNode | null>(null);

  // State refs
  const accumulatedBufferRef = useRef<Int16Array>(new Int16Array(0));
  const connectionGuardRef = useRef(false);

  const generateClientToken = trpc.voice.generateClientToken.useMutation();

  useEffect(() => {
    return () => cleanup();
  }, []);

  const updateState = useCallback((updates: Partial<TranscriptionState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback(
    (message: string) => {
      updateState({ error: message, isConnecting: false, isRecording: false });
      onError?.(message);
    },
    [updateState, onError]
  );

  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const permissionResult = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      if (permissionResult.state === "granted") return true;

      // Fallback permission check
      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      testStream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }, []);

  const createWebSocketConnection = useCallback(
    async (clientSecret: string): Promise<void> => {
      if (
        connectionGuardRef.current ||
        websocketRef.current?.readyState === WebSocket.OPEN
      ) {
        return;
      }

      connectionGuardRef.current = true;

      return new Promise((resolve, reject) => {
        const websocketUrl =
          "wss://api.openai.com/v1/realtime?intent=transcription";
        const protocols = [
          ...AUDIO_CONFIG.websocketProtocols,
          `openai-insecure-api-key.${clientSecret}`,
        ];

        const websocket = new WebSocket(websocketUrl, protocols);
        websocketRef.current = websocket;

        const timeoutId = setTimeout(() => {
          if (websocket.readyState !== WebSocket.OPEN) {
            connectionGuardRef.current = false;
            reject(new Error("WebSocket connection timeout"));
          }
        }, AUDIO_CONFIG.connectionTimeout);

        websocket.onopen = () => {
          clearTimeout(timeoutId);
          websocket.send(
            JSON.stringify({
              type: "session.update",
              session: {
                input_audio_format: "pcm16",
                input_audio_transcription: {
                  model: "gpt-4o-mini-transcribe",
                  language: "en",
                },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.7,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 200,
                },
              },
            })
          );
          connectionGuardRef.current = false;
          resolve();
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (
              message.type ===
              "conversation.item.input_audio_transcription.completed"
            ) {
              onTranscript?.(message.transcript);
            }

            if (message.type === "error") {
              handleError(message.error?.message || "Transcription failed");
            }
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
          }
        };

        websocket.onerror = () => {
          clearTimeout(timeoutId);
          connectionGuardRef.current = false;
          reject(new Error("WebSocket connection failed"));
        };

        websocket.onclose = (event) => {
          connectionGuardRef.current = false;
          if (event.code !== 1000) {
            handleError("Connection closed unexpectedly");
          }
        };
      });
    },
    [onTranscript, handleError]
  );

  const transmitAudioBuffer = useCallback(() => {
    const websocket = websocketRef.current;
    const buffer = accumulatedBufferRef.current;

    if (websocket?.readyState !== WebSocket.OPEN || buffer.length === 0) {
      return;
    }

    try {
      const audioBytes = new Uint8Array(buffer.buffer);
      const base64Audio = btoa(String.fromCharCode(...audioBytes));

      websocket.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio,
        })
      );

      accumulatedBufferRef.current = new Int16Array(0);
    } catch (error) {
      console.error("Failed to transmit audio buffer:", error);
    }
  }, []);

  const setupAudioPipeline = useCallback(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: AUDIO_CONFIG.sampleRate,
        channelCount: 1,
      },
    });

    mediaStreamRef.current = mediaStream;

    const audioContext = new AudioContext({
      sampleRate: AUDIO_CONFIG.sampleRate,
    });
    audioContextRef.current = audioContext;

    // Register audio worklet processor
    const workletBlob = new Blob([WORKLET_PROCESSOR_CODE], {
      type: "application/javascript",
    });
    const workletUrl = URL.createObjectURL(workletBlob);

    await audioContext.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    // Create and configure processor node
    const processorNode = new AudioWorkletNode(audioContext, "audio-processor");
    processorNodeRef.current = processorNode;

    processorNode.port.onmessage = (event) => {
      const pcmData = event.data as Int16Array;

      // Accumulate audio data
      const currentBuffer = accumulatedBufferRef.current;
      const newBuffer = new Int16Array(currentBuffer.length + pcmData.length);
      newBuffer.set(currentBuffer);
      newBuffer.set(pcmData, currentBuffer.length);
      accumulatedBufferRef.current = newBuffer;

      // Transmit when buffer is large enough
      if (newBuffer.length >= AUDIO_CONFIG.bufferSize) {
        transmitAudioBuffer();
      }
    };

    // Connect audio pipeline
    const sourceNode = audioContext.createMediaStreamSource(mediaStream);
    sourceNode.connect(processorNode);
  }, [transmitAudioBuffer]);

  const cleanup = useCallback(() => {
    // Stop audio processing
    processorNodeRef.current?.disconnect();
    audioContextRef.current?.close();

    // Release media resources
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Close WebSocket connection
    const websocket = websocketRef.current;
    if (websocket?.readyState === WebSocket.OPEN) {
      // Send remaining buffer
      if (accumulatedBufferRef.current.length > 0) {
        transmitAudioBuffer();
      }
      websocket.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      websocket.close(1000, "Recording stopped");
    }

    // Reset all refs
    websocketRef.current = null;
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    processorNodeRef.current = null;
    accumulatedBufferRef.current = new Int16Array(0);
    connectionGuardRef.current = false;
  }, [transmitAudioBuffer]);

  const startRecording = useCallback(async () => {
    const canStart =
      !state.isRecording && !state.isConnecting && !connectionGuardRef.current;
    if (!canStart) return;

    try {
      updateState({ isConnecting: true, error: null });

      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        throw new Error("Microphone permission required");
      }

      updateState({ hasPermission: true });

      const tokenResponse = await generateClientToken.mutateAsync({
        apiKey: keys.openai,
      });

      await createWebSocketConnection(tokenResponse.client_secret);
      await setupAudioPipeline();

      updateState({ isRecording: true, isConnecting: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start recording";
      handleError(errorMessage);
    }
  }, [
    state.isRecording,
    state.isConnecting,
    updateState,
    checkMicrophonePermission,
    generateClientToken,
    createWebSocketConnection,
    setupAudioPipeline,
    handleError,
    keys.openai,
  ]);

  const stopRecording = useCallback(() => {
    try {
      cleanup();
      updateState({ isRecording: false, isConnecting: false, error: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to stop recording";
      handleError(errorMessage);
    }
  }, [cleanup, updateState, handleError]);

  const toggleRecording = useCallback(async () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  return {
    ...state,
    start: startRecording,
    stop: stopRecording,
    toggle: toggleRecording,
    cleanup,
  };
};

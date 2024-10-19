import sounddevice as sd
import wave
import os
import tempfile
import uuid
from openai import OpenAI
import speech_recognition as sr
import pygame
from elevenlabs import VoiceSettings
from elevenlabs.client import ElevenLabs
import numpy as np
import io

client = OpenAI(api_key="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")

# Initialize ElevenLabs client
ELEVENLABS_API_KEY = "sk_ce786f8a8a834147b67667cd62cb2bc3677b38b8a1da2477"
elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

# Initialize pygame mixer for audio playback
pygame.mixer.init()

def record_audio(duration=5):
    RATE = 16000
    CHANNELS = 1

    print("Recording...")
    recording = sd.rec(int(duration * RATE), samplerate=RATE, channels=CHANNELS, dtype='int16')
    sd.wait()  # Wait for the recording to finish
    print("Finished recording.")

    # Save the recorded audio to a temporary WAV file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio_file:
        wf = wave.open(temp_audio_file.name, 'wb')
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(2)  # 2 bytes for 'int16' dtype
        wf.setframerate(RATE)
        wf.writeframes(recording.tobytes())
        wf.close()

    return temp_audio_file.name

def transcribe_audio(audio_file_path):
    try:
        with open(audio_file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        return transcription.text
    finally:
        # Clean up the temporary file
        os.unlink(audio_file_path)

def text_to_speech(text: str):
    # Calling the text_to_speech conversion API with detailed parameters
    response = elevenlabs_client.text_to_speech.convert(
        voice_id="4xkUqaR9MYOJHoaC1Nak",  # Adam pre-made voice
        output_format="mp3_22050_32",
        text=text,
        model_id="eleven_multilingual_v2",  # use the turbo model for low latency
        voice_settings=VoiceSettings(
            stability=0.0,
            similarity_boost=1.0,
            style=0.0,
            use_speaker_boost=True,
        ),
    )
    
    # Load audio into memory using BytesIO
    mp3_data = io.BytesIO()
    
    for chunk in response:
        if chunk:
            mp3_data.write(chunk)
    
    mp3_data.seek(0)  # Go back to the start of the BytesIO stream

    # Initialize the mixer if not already initialized
    if not pygame.mixer.get_init():
        pygame.mixer.init()

    # Load the audio from memory
    pygame.mixer.music.load(mp3_data, 'mp3')
    pygame.mixer.music.play()
    
    # Wait until the audio finishes playing
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)

def main():
    recognizer = sr.Recognizer()
    microphone = sr.Microphone()

    print("Listening for 'elliot'...")

    while True:
        with microphone as source:
            recognizer.adjust_for_ambient_noise(source)
            audio = recognizer.listen(source)

        try:
            text = recognizer.recognize_google(audio).lower()
            print(f"Heard: {text}")

            if "elliot" in text:
                print("Wake word detected! Listening for your question...")
                text_to_speech("How can I help you?")

                audio_file_path = record_audio(5)  # Record for 5 seconds
                question_text = transcribe_audio(audio_file_path)
                print(f"Question: {question_text}")

                # Generate response using OpenAI API
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant."},
                        {"role": "user", "content": question_text}
                    ]
                )
                answer = response.choices[0].message.content
                print(f"Answer: {answer}")

                # Convert answer to speech and play it
                text_to_speech(answer)

                print("Listening for 'Elliot'...")

        except sr.UnknownValueError:
            pass
        except sr.RequestError as e:
            print(f"Could not request results; {e}")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()

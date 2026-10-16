export class SoundService {
    /**
     * Play keyboard sound
     */
    play() {
        try {
            const audioContext = new(window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.05;

            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 0.05
            );
            oscillator.stop(audioContext.currentTime + 0.05);
        } catch (err) {
            console.error('SoundService: Error playing sound:', err);
        }
    }
}
createApp({
    data() {
        return {
            searchQuery: '',
            searchResults: [],
            videoUrl: '',
            transcript: [],
            loading: false,
            error: null
        };
    },
    methods: {
        async performYoutubeSearch() {
            if (!this.searchQuery)
                return;
            this.loading = true;
            try {
                const response = await fetch('/api/youtube_search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: this.searchQuery })
                });
                if (!response.ok)
                    throw new Error('YouTube search failed');
                const data = await response.json();
                this.searchResults = data.results;
            }
            catch (err) {
                this.error = err.message;
            }
            finally {
                this.loading = false;
            }
        },
        async transcribeVideo() {
            if (!this.videoUrl)
                return;
            this.loading = true;
            try {
                const response = await fetch('/api/transcribe_video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoUrl: this.videoUrl })
                });
                if (!response.ok)
                    throw new Error('Video transcription failed');
                const data = await response.json();
                this.transcript = data.transcript;
            }
            catch (err) {
                this.error = err.message;
            }
            finally {
                this.loading = false;
            }
        },
        selectVideo(video) {
            this.videoUrl = video.url;
            this.searchQuery = '';
            this.searchResults = [];
        }
    }
}).mount('#app');
export {};
//# sourceMappingURL=youtube_transcriber.js.map
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Optional

from yt_dlp import YoutubeDL

from src.utils import ensure_output_folder, get_config, get_worker_count, setup_logging


class YouTubeTranscriptFetcher:
    """A class to fetch transcripts from YouTube videos.

    This class provides functionality to download transcripts (both human-generated
    and automatic) from YouTube videos using yt-dlp library.
    """

    def __init__(
        self,
        output_folder: Optional[str] = None,
        language: Optional[str] = None,
        num_workers: Optional[int] = None,
    ):
        """Initialize the YouTubeTranscriptFetcher.

        Args:
            output_folder (Optional[str]): Directory where transcripts will be saved.
                If None, uses config default.
            language (Optional[str]): Language code for subtitles. If None, uses config default.
            num_workers (Optional[int]): Number of concurrent workers for parallel processing.
                If None, auto-detects based on config and CPU count.
        """
        # Initialize configuration and logging
        setup_logging()

        # Set configuration values
        self.output_folder = output_folder or get_config(
            "processing.transcripts.output_folder", "transcripts"
        )
        self.language = language or get_config("processing.transcripts.language", "en")
        self.num_workers = get_worker_count(num_workers)

        # Ensure output folder exists
        self.output_folder = ensure_output_folder(self.output_folder)

    def _get_ydl_opts(self) -> dict:
        """Get the yt-dlp options configuration.

        Returns:
            dict: Configuration options for yt-dlp.
        """
        return {
            "skip_download": get_config("download.skip_download", True),
            "writesubtitles": get_config(
                "download.write_subtitles", True
            ),  # human captions
            "writeautomaticsub": get_config(
                "download.write_automatic_sub", True
            ),  # auto captions
            "subtitleslangs": [self.language],
            "subtitlesformat": get_config("download.subtitles_format", "srt"),
            "outtmpl": os.path.join(
                self.output_folder,
                get_config("download.output_template", "%(id)s.%(ext)s"),
            ),
            # Additional options to improve subtitle fetching reliability
            "ignoreerrors": False,  # Don't ignore errors to get proper feedback
        }

    def _fetch_with_transcript_api(self, video_id: str) -> bool:
        """Fetch transcript using youtube_transcript_api library.
        
        Args:
            video_id (str): YouTube video ID.
            
        Returns:
            bool: True if successful, False otherwise.
        """
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            from youtube_transcript_api.formatters import SRTFormatter
            
            print(f"[FETCH] Attempting youtube-transcript-api for {video_id}...")
            
            # Instantiate the API
            api = YouTubeTranscriptApi()
            
            # Get the transcript list
            transcript_list = api.list(video_id)
            
            # Try to find the requested language, or fallback to English
            try:
                transcript = transcript_list.find_transcript([self.language, 'en'])
            except:
                # If specified languages not found, just take the first one available
                transcript = next(iter(transcript_list))
                
            transcript_data = transcript.fetch()
            
            # Format to SRT
            formatter = SRTFormatter()
            srt_content = formatter.format_transcript(transcript_data)
            
            # Save to file
            output_path = os.path.join(self.output_folder, f"{video_id}.{self.language}.srt")
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(srt_content)
                
            print(f"[FETCH] [SUCCESS] Saved transcript using API: {output_path}")
            return True
        except Exception as e:
            print(f"[FETCH] youtube-transcript-api failed for {video_id}: {str(e)}")
            return False

    def fetch_transcript(self, url: str) -> bool:
        """Fetch transcript for a single YouTube video.

        Args:
            url (str): YouTube video URL.

        Returns:
            bool: True if transcript was successfully downloaded, False otherwise.
        """
        # Extract video ID
        video_id = ""
        if "v=" in url:
            video_id = url.split("v=")[1].split("&")[0]
        elif "be/" in url:
            video_id = url.split("be/")[1].split("?")[0]
            
        # Try youtube-transcript-api first as it is more reliable for bots
        if video_id:
            if self._fetch_with_transcript_api(video_id):
                return True
                
        # Fallback to yt-dlp
        print(f"[FETCH] Falling back to yt-dlp for {url}...")
        try:
            with YoutubeDL(self._get_ydl_opts()) as ydl:
                ydl.download([url])
            return True
        except Exception as e:
            print(f"Error downloading transcript for {url} with yt-dlp: {str(e)}")
            return False

    def _fetch_transcripts_sequential(self, urls: List[str]) -> dict:
        """Fetch transcripts sequentially (one at a time).

        Args:
            urls (List[str]): List of YouTube video URLs.

        Returns:
            dict: Dictionary with URLs as keys and success status as values.
        """
        results = {}
        for url in urls:
            print(f"Fetching transcript for: {url}")
            results[url] = self.fetch_transcript(url)
        return results

    def _fetch_transcripts_parallel(self, urls: List[str]) -> dict:
        """Fetch transcripts in parallel using ThreadPoolExecutor.

        Args:
            urls (List[str]): List of YouTube video URLs.

        Returns:
            dict: Dictionary with URLs as keys and success status as values.
        """
        results = {}

        with ThreadPoolExecutor(max_workers=self.num_workers) as executor:
            # Submit all download tasks
            future_to_url = {
                executor.submit(self.fetch_transcript, url): url for url in urls
            }

            # Process completed tasks
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    success = future.result()
                    results[url] = success
                    status = "Success" if success else "Failed"
                    print(f"Completed {url}: {status}")
                except Exception as e:
                    results[url] = False
                    print(f"Error processing {url}: {str(e)}")

        return results

    def fetch_transcripts(self, urls: List[str]) -> dict:
        """Fetch transcripts for multiple YouTube videos with automatic parallel/sequential fallback.

        Args:
            urls (List[str]): List of YouTube video URLs.

        Returns:
            dict: Dictionary with URLs as keys and success status as values.
        """
        if not urls:
            return {}

        # Use sequential processing if num_workers is 0 or only one URL
        if self.num_workers == 0 or len(urls) == 1:
            print(f"Using sequential processing for {len(urls)} URL(s)")
            return self._fetch_transcripts_sequential(urls)

        # Try parallel processing first
        try:
            print(
                f"Using parallel processing with {self.num_workers} workers for {len(urls)} URLs"
            )
            return self._fetch_transcripts_parallel(urls)
        except Exception as e:
            print(
                f"Parallel processing failed ({str(e)}), falling back to sequential processing"
            )
            return self._fetch_transcripts_sequential(urls)


# Example usage
if __name__ == "__main__":
    # Example URLs
    urls = [
        "https://www.youtube.com/watch?v=UV81LAb3x2g",
        # "https://www.youtube.com/watch?v=q6kJ71tEYqM",
        # "https://www.youtube.com/watch?v=gpz6C_2l5jI",
    ]

    # Initialize the fetcher
    fetcher = YouTubeTranscriptFetcher(output_folder="transcripts")

    # Fetch transcripts
    results = fetcher.fetch_transcripts(urls)

    # Print results
    for url, success in results.items():
        status = "Success" if success else "Failed"
        print(f"{url}: {status}")

from pydantic import BaseModel, Field, HttpUrl
from typing import List
from content_writer_agent import BlogPostDraft, ContentWriterInput

class SEO_OptimizerInput(BaseModel):
    """
    Input required to optimize a blog post draft.
    """
    draft: BlogPostDraft = Field(..., description="The draft content from the ContentWriterAgent.")
    post_details: ContentWriterInput = Field(..., description="The original content brief containing keywords and other details.")
    existing_blog_post_urls: List[HttpUrl] = Field(..., description="A list of URLs for other posts on the blog for internal linking.")

class OptimizedBlogPost(BaseModel):
    """
    A fully optimized blog post ready for publication.
    """
    headline: str = Field(..., description="The final, SEO-optimized title.")
    meta_description: str = Field(..., description="A compelling meta description (under 160 characters) to improve click-through rates.")
    optimized_content: str = Field(..., description="The full post content with keywords naturally integrated and links added, in Markdown format.")
    image_alt_text_suggestions: List[str] = Field(..., description="Suggested alt-text for images related to the post content.")
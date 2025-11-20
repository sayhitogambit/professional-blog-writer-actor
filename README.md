# Professional Blog Writer with AI Images

Create comprehensive, SEO-optimized blog articles (2000-5000 words) with AI-generated images, executive summaries, table of contents, references, and professional HTML formatting.

## Features

### 📝 Comprehensive Article Generation
- **2000-5000 words** of high-quality, well-researched content
- **Professional structure** with H2 and H3 headings
- **Multiple tones**: Professional, Conversational, Technical, Educational, Inspirational
- **Target audience customization** for personalized content

### 🎨 AI-Generated Images
- Generate **1-5 relevant images** using FLUX or DALL-E models
- Automatic image prompt generation based on article content
- Support for **FLUX 1.1 Pro**, **FLUX Schnell** (free), and **DALL-E 3**
- Returns actual image URLs ready to use

### 📊 Executive Summary
- **100-150 word** professional summary
- Perfect for busy readers and social media
- Optional - can be toggled on/off

### 🔗 Table of Contents
- **Auto-generated** from article headings
- **Clickable anchor links** for easy navigation
- Clean, professional formatting

### 📚 References & Sources
- **5-8 authoritative sources** suggested
- Properly formatted references section
- Enhances credibility and SEO

### 🎯 SEO Optimization
- **Meta description** (150-160 characters)
- **Natural keyword integration** throughout content
- **SEO Score** (0-100) with detailed analysis
- Optimal keyword density and structure

### 💼 Dual Format Output
- **HTML**: Semantic HTML5 with proper tags
- **Markdown**: Clean markdown for easy editing
- Both formats included in every output

### 📢 Call-to-Action
- Customizable CTA section
- Professional formatting
- Optional - add your own CTA text

### 💰 Cost Tracking & Transparency
- Detailed breakdown of writing and image costs
- Automatic profit calculation
- Dynamic pricing based on length and images

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | String | ✅ | Main topic or title for the article |
| `keywords` | Array | ✅ | SEO keywords (1-10) |
| `openrouterApiKey` | String | ✅ | Your OpenRouter API key |
| `targetAudience` | String | ❌ | Target audience (e.g., "marketing professionals") |
| `wordCount` | Integer | ❌ | Target word count (1000-5000, default: 2000) |
| `tone` | String | ❌ | Writing tone (default: "professional") |
| `includeImages` | Boolean | ❌ | Generate AI images (default: true) |
| `numberOfImages` | Integer | ❌ | Number of images (1-5, default: 3) |
| `includeTableOfContents` | Boolean | ❌ | Add TOC (default: true) |
| `includeExecutiveSummary` | Boolean | ❌ | Add summary (default: true) |
| `includeReferences` | Boolean | ❌ | Add references (default: true) |
| `includeCallToAction` | Boolean | ❌ | Add CTA (default: true) |
| `ctaText` | String | ❌ | Custom CTA text |
| `industryContext` | String | ❌ | Industry/context for the article |
| `writingModel` | String | ❌ | AI model for writing (default: "claude-3.5-sonnet") |
| `imageModel` | String | ❌ | AI model for images (default: "flux-schnell") |

## Output Structure

The actor returns a comprehensive JSON object with:

- ✅ **Article title and subtitle**
- ✅ **Executive summary**
- ✅ **Table of contents** (array of headings with anchors)
- ✅ **Full content** in HTML and Markdown
- ✅ **Meta description and keywords**
- ✅ **AI-generated image URLs**
- ✅ **Image prompts used**
- ✅ **References list**
- ✅ **Call-to-action HTML**
- ✅ **Word count and reading time**
- ✅ **SEO score (0-100)**
- ✅ **Cost breakdown** (writing + images)
- ✅ **Profit calculation**
- ✅ **Usage statistics**

## Usage Example

```json
{
  "topic": "The Future of AI in Content Marketing",
  "keywords": ["AI content", "content marketing", "automation", "SEO"],
  "targetAudience": "Marketing professionals and content creators",
  "wordCount": 2500,
  "tone": "professional",
  "includeImages": true,
  "numberOfImages": 3,
  "industryContext": "Digital Marketing",
  "writingModel": "anthropic/claude-3.5-sonnet",
  "imageModel": "black-forest-labs/flux-schnell",
  "openrouterApiKey": "YOUR_API_KEY"
}
```

## Pricing

Dynamic pricing based on article length and number of images:

- **Base**: $2.00
- **1500+ words**: +$1.00
- **2000+ words**: +$2.00
- **3000+ words**: +$3.00
- **Per image**: +$0.50

**Example**: 2500-word article with 3 images = $5.50

## Recommended AI Models

### For Writing:
- **Claude 3.5 Sonnet** (Recommended) - Best quality, excellent for long-form content
- **GPT-4o** - Fast and reliable
- **Claude 3 Opus** - Premium quality

### For Images:
- **FLUX Schnell** (Recommended) - Free and fast
- **FLUX 1.1 Pro** - Highest quality
- **DALL-E 3** - Premium option

## Getting Started

1. Get your OpenRouter API key from [openrouter.ai/keys](https://openrouter.ai/keys)
2. Configure the actor with your desired parameters
3. Run the actor
4. Receive a professional blog article ready to publish!

## Use Cases

- 📰 **Content Marketing**: Create engaging blog posts for your website
- 🎓 **Thought Leadership**: Establish authority in your industry
- 📈 **SEO Content**: Rank higher with optimized articles
- 📝 **Technical Documentation**: Explain complex topics clearly
- 💼 **Business Insights**: Share professional analysis and insights

## Technical Details

- **Built with**: Apify SDK, OpenRouter API
- **Node.js**: Version 18+
- **Models**: Claude, GPT-4, FLUX, DALL-E
- **Output**: HTML, Markdown, JSON

## Support

For issues or questions:
- Check the [OpenRouter documentation](https://openrouter.ai/docs)
- Review the [Apify documentation](https://docs.apify.com)

## License

Apache-2.0

---

**Created with ❤️ for professional content creators**

import { Actor } from 'apify';
import axios from 'axios';

// OpenRouter API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_IMAGE_URL = 'https://openrouter.ai/api/v1/images/generations';

// Model pricing per million tokens (input/output) and per image
const MODEL_PRICING = {
    // Text models
    'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
    'openai/gpt-4o': { input: 2.50, output: 10.00 },
    'anthropic/claude-3-opus': { input: 15.00, output: 75.00 },

    // Image models (per image)
    'black-forest-labs/flux-1.1-pro': { perImage: 0.04 },
    'openai/dall-e-3': { perImage: 0.08 },
    'black-forest-labs/flux-schnell': { perImage: 0.00 } // Free tier
};

await Actor.main(async () => {
    const input = await Actor.getInput();
    console.log('Input:', JSON.stringify(input, null, 2));

    // Validate required inputs
    if (!input?.topic) {
        throw new Error('Topic is required');
    }
    if (!input?.keywords || input.keywords.length === 0) {
        throw new Error('At least one SEO keyword is required');
    }
    if (!input?.openrouterApiKey) {
        throw new Error('OpenRouter API key is required. Get one at https://openrouter.ai/keys');
    }

    const {
        topic,
        keywords,
        targetAudience = 'general readers',
        wordCount = 2000,
        tone = 'professional',
        includeImages = true,
        numberOfImages = 3,
        includeTableOfContents = true,
        includeExecutiveSummary = true,
        includeReferences = true,
        includeCallToAction = true,
        ctaText = null,
        industryContext = null,
        writingModel = 'anthropic/claude-3.5-sonnet',
        imageModel = 'black-forest-labs/flux-schnell',
        openrouterApiKey
    } = input;

    console.log('\n========================================');
    console.log('PROFESSIONAL BLOG WRITER ACTOR');
    console.log('========================================');
    console.log(`Topic: "${topic}"`);
    console.log(`Target Words: ${wordCount}`);
    console.log(`Keywords: ${keywords.join(', ')}`);
    console.log(`Target Audience: ${targetAudience}`);
    console.log(`Writing Model: ${writingModel}`);
    if (includeImages) {
        console.log(`Image Model: ${imageModel}`);
        console.log(`Number of Images: ${numberOfImages}`);
    }
    console.log('========================================\n');

    const startTime = Date.now();
    let writingCost = 0;
    let imageCost = 0;
    let writingTokens = 0;
    let imageGenerations = 0;

    try {
        // STEP 1: Generate the article content
        console.log('Step 1/5: Generating article content...');
        const articleResult = await generateArticle({
            topic,
            keywords,
            targetAudience,
            wordCount,
            tone,
            industryContext,
            includeExecutiveSummary,
            includeReferences,
            includeCallToAction,
            ctaText,
            writingModel,
            openrouterApiKey
        });

        writingCost = articleResult.cost;
        writingTokens = articleResult.usage.total_tokens;
        console.log(`✓ Article generated (${articleResult.wordCount} words)`);
        console.log(`  Tokens: ${writingTokens}, Cost: $${writingCost.toFixed(6)}`);

        // STEP 2: Generate table of contents
        let tableOfContents = [];
        if (includeTableOfContents) {
            console.log('\nStep 2/5: Generating table of contents...');
            tableOfContents = generateTableOfContents(articleResult.contentHTML);
            console.log(`✓ TOC generated with ${tableOfContents.length} sections`);
        } else {
            console.log('\nStep 2/5: Skipping table of contents (disabled)');
        }

        // STEP 3: Generate images
        let imageUrls = [];
        let imagePrompts = [];
        if (includeImages && numberOfImages > 0) {
            console.log(`\nStep 3/5: Generating ${numberOfImages} AI images...`);
            const imageResult = await generateImages({
                topic,
                keywords,
                articleContent: articleResult.contentHTML,
                numberOfImages,
                imageModel,
                openrouterApiKey
            });

            imageUrls = imageResult.imageUrls;
            imagePrompts = imageResult.prompts;
            imageCost = imageResult.cost;
            imageGenerations = imageResult.count;
            console.log(`✓ Generated ${imageUrls.length} images, Cost: $${imageCost.toFixed(6)}`);
        } else {
            console.log('\nStep 3/5: Skipping image generation (disabled)');
        }

        // STEP 4: Convert to Markdown
        console.log('\nStep 4/5: Converting to Markdown...');
        const contentMarkdown = htmlToMarkdown(articleResult.contentHTML);
        console.log('✓ Markdown conversion complete');

        // STEP 5: Calculate SEO score
        console.log('\nStep 5/5: Calculating SEO metrics...');
        const seoScore = calculateSEOScore({
            title: articleResult.title,
            metaDescription: articleResult.metaDescription,
            content: articleResult.contentHTML,
            keywords,
            wordCount: articleResult.wordCount,
            hasImages: imageUrls.length > 0,
            hasTOC: tableOfContents.length > 0
        });
        console.log(`✓ SEO Score: ${seoScore}/100`);

        // Calculate final costs and metrics
        const totalCost = writingCost + imageCost;
        const chargePrice = calculateChargePrice(wordCount, numberOfImages);
        const profit = chargePrice - totalCost;
        const profitMargin = (profit / chargePrice) * 100;
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        // Prepare complete output
        const output = {
            // Content
            title: articleResult.title,
            subtitle: articleResult.subtitle,
            executiveSummary: articleResult.executiveSummary,
            tableOfContents,
            contentHTML: articleResult.contentHTML,
            contentMarkdown,

            // SEO
            metaDescription: articleResult.metaDescription,
            metaKeywords: keywords,
            seoScore,

            // Images
            imageUrls,
            imagePrompts,

            // References and CTA
            references: articleResult.references,
            callToAction: articleResult.callToAction,

            // Metrics
            wordCount: articleResult.wordCount,
            readingTime: Math.ceil(articleResult.wordCount / 200), // Average reading speed

            // Models used
            writingModel,
            imageModel: includeImages ? imageModel : null,

            // Usage statistics
            usage: {
                writing_tokens: writingTokens,
                image_generations: imageGenerations
            },

            // Cost tracking
            writingCost: parseFloat(writingCost.toFixed(6)),
            imageCost: parseFloat(imageCost.toFixed(6)),
            cost: parseFloat(totalCost.toFixed(6)),
            chargePrice,
            profit: parseFloat(profit.toFixed(6)),
            profitMargin: parseFloat(profitMargin.toFixed(2)),

            // Metadata
            duration: parseFloat(duration),
            generatedAt: new Date().toISOString()
        };

        // Save to dataset
        await Actor.pushData(output);

        // Print summary
        console.log('\n========================================');
        console.log('✓ BLOG ARTICLE GENERATED SUCCESSFULLY!');
        console.log('========================================');
        console.log(`Title: ${output.title}`);
        console.log(`Word Count: ${output.wordCount} words`);
        console.log(`Reading Time: ${output.readingTime} minutes`);
        console.log(`SEO Score: ${output.seoScore}/100`);
        console.log(`Images: ${output.imageUrls.length}`);
        console.log(`References: ${output.references.length}`);
        console.log('----------------------------------------');
        console.log(`Writing Cost: $${output.writingCost}`);
        console.log(`Image Cost: $${output.imageCost}`);
        console.log(`Total Cost: $${output.cost}`);
        console.log(`Charge Price: $${output.chargePrice}`);
        console.log(`Profit: $${output.profit} (${output.profitMargin}% margin)`);
        console.log(`Duration: ${output.duration}s`);
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ Error generating blog article:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        throw error;
    }
});

/**
 * Generate the main article content using AI
 */
async function generateArticle(options) {
    const {
        topic,
        keywords,
        targetAudience,
        wordCount,
        tone,
        industryContext,
        includeExecutiveSummary,
        includeReferences,
        includeCallToAction,
        ctaText,
        writingModel,
        openrouterApiKey
    } = options;

    const prompt = buildArticlePrompt({
        topic,
        keywords,
        targetAudience,
        wordCount,
        tone,
        industryContext,
        includeExecutiveSummary,
        includeReferences,
        includeCallToAction,
        ctaText
    });

    const result = await callOpenRouterText(prompt, writingModel, openrouterApiKey);

    // Parse the JSON response
    let articleData;
    try {
        articleData = JSON.parse(result.content);
    } catch (parseError) {
        console.error('Failed to parse article JSON:', result.content);
        throw new Error('AI returned invalid JSON response');
    }

    // Calculate cost
    const cost = calculateTextCost(result.usage, writingModel);

    return {
        title: articleData.title,
        subtitle: articleData.subtitle || '',
        executiveSummary: articleData.executiveSummary || '',
        contentHTML: articleData.contentHTML,
        metaDescription: articleData.metaDescription,
        references: articleData.references || [],
        callToAction: articleData.callToAction || '',
        wordCount: countWords(articleData.contentHTML),
        usage: result.usage,
        cost: cost.totalCost
    };
}

/**
 * Build the article generation prompt
 */
function buildArticlePrompt(options) {
    const {
        topic,
        keywords,
        targetAudience,
        wordCount,
        tone,
        industryContext,
        includeExecutiveSummary,
        includeReferences,
        includeCallToAction,
        ctaText
    } = options;

    const industryText = industryContext ? `\nIndustry/Context: ${industryContext}` : '';
    const ctaTextInfo = ctaText ? `\nUse this CTA text: "${ctaText}"` : '';

    return `You are an expert professional blog writer and content strategist. Create a comprehensive, well-researched, and engaging blog article.

ARTICLE REQUIREMENTS:
Topic: "${topic}"
Target Audience: ${targetAudience}
Target Length: ${wordCount} words (aim for 90-110% of this target)
Writing Tone: ${tone}
SEO Keywords: ${keywords.join(', ')}${industryText}

CONTENT STRUCTURE:
1. Compelling, professional title (50-70 characters, SEO optimized)
2. Engaging subtitle that complements the title${includeExecutiveSummary ? '\n3. Executive Summary (100-150 words) - concise overview for busy executives' : ''}
4. Introduction that hooks the reader
5. Main content with:
   - Well-organized sections using H2 headings
   - Subsections with H3 headings where appropriate
   - Each section 300-500 words
   - Clear, logical flow between sections
   - Data, statistics, or expert insights where relevant
   - Practical examples and actionable advice
   - Bullet points and numbered lists for clarity
6. Strong conclusion that summarizes key points${includeCallToAction ? `\n7. Call-to-Action section${ctaTextInfo}` : ''}${includeReferences ? '\n8. References section with 5-8 suggested authoritative sources' : ''}

WRITING GUIDELINES:
- Use ${tone} language throughout
- Write for ${targetAudience} specifically
- Naturally integrate keywords: ${keywords.join(', ')}
- Use concrete examples and real-world applications
- Include transitional phrases between sections
- Write in active voice
- Use short paragraphs (3-4 sentences max)
- Include varied sentence structure
- Ensure content is original, informative, and valuable
- Make it scannable with clear headings and formatting

HTML FORMATTING:
- Use semantic HTML5 tags
- H2 for main sections (use id attributes for anchors: id="section-name")
- H3 for subsections
- <p> for paragraphs
- <strong> for emphasis
- <em> for softer emphasis
- <ul> and <li> for bullet lists
- <ol> and <li> for numbered lists
- <blockquote> for quotes or callouts
- NO H1 tags (that's for the title)

SEO OPTIMIZATION:
- Meta description: 150-160 characters, compelling, includes main keyword
- Natural keyword integration (avoid keyword stuffing)
- Front-load important keywords in title and first paragraph
- Use semantic variations of keywords
- Optimize headings with keywords

Return the result in this exact JSON format:
{
    "title": "Professional, SEO-optimized article title",
    "subtitle": "Engaging subtitle that complements the title",
    "executiveSummary": "${includeExecutiveSummary ? '100-150 word executive summary' : ''}",
    "contentHTML": "<h2 id='introduction'>Introduction</h2><p>Full HTML article content with proper semantic tags...</p>",
    "metaDescription": "150-160 character SEO meta description",
    "references": ${includeReferences ? '["Source 1: Title - URL or description", "Source 2: ..."]' : '[]'},
    "callToAction": "${includeCallToAction ? '<div class=\\"cta\\"><h3>Ready to Get Started?</h3><p>CTA content...</p></div>' : ''}"
}

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanations - just the JSON object.`;
}

/**
 * Generate AI images for the article
 */
async function generateImages(options) {
    const {
        topic,
        keywords,
        articleContent,
        numberOfImages,
        imageModel,
        openrouterApiKey
    } = options;

    console.log('  Generating image prompts...');

    // First, generate optimized image prompts based on the article
    const promptsResult = await generateImagePrompts({
        topic,
        keywords,
        articleContent,
        numberOfImages,
        openrouterApiKey
    });

    const imagePrompts = promptsResult.prompts;
    console.log(`  Generated ${imagePrompts.length} image prompts`);

    // Generate images using the prompts
    const imageUrls = [];
    let totalCost = 0;

    for (let i = 0; i < imagePrompts.length; i++) {
        console.log(`  Generating image ${i + 1}/${imagePrompts.length}...`);

        try {
            const imageUrl = await callOpenRouterImage(
                imagePrompts[i],
                imageModel,
                openrouterApiKey
            );

            imageUrls.push(imageUrl);

            // Calculate per-image cost
            const pricing = MODEL_PRICING[imageModel] || { perImage: 0.04 };
            totalCost += pricing.perImage;

            // Small delay between images to avoid rate limiting
            if (i < imagePrompts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.warn(`  ⚠ Failed to generate image ${i + 1}: ${error.message}`);
            // Continue with other images even if one fails
        }
    }

    return {
        imageUrls,
        prompts: imagePrompts,
        cost: totalCost,
        count: imageUrls.length
    };
}

/**
 * Generate optimized image prompts based on article content
 */
async function generateImagePrompts(options) {
    const {
        topic,
        keywords,
        articleContent,
        numberOfImages,
        openrouterApiKey
    } = options;

    // Extract section headings for context
    const headings = extractHeadings(articleContent);
    const headingsText = headings.slice(0, 10).join(', ');

    const prompt = `Based on this blog article, generate ${numberOfImages} detailed image prompts for AI image generation.

Article Topic: "${topic}"
Keywords: ${keywords.join(', ')}
Article Sections: ${headingsText}

Requirements for each image prompt:
- Create prompts that visually represent key concepts from the article
- Make prompts detailed and specific (20-40 words each)
- Use professional, high-quality style descriptors
- Avoid text or words in images
- Focus on concepts, metaphors, or visualizations
- Diverse image subjects (not all similar)
- Professional business/editorial style
- Good for blog headers or section illustrations

Return ONLY a JSON array of prompts, no other text:
["Detailed prompt 1 for professional image generation...", "Detailed prompt 2...", ...]`;

    const result = await callOpenRouterText(
        prompt,
        'anthropic/claude-3.5-sonnet',
        openrouterApiKey,
        1000 // Lower token limit for prompts
    );

    let prompts;
    try {
        prompts = JSON.parse(result.content);
    } catch (parseError) {
        // Fallback: try to extract array from text
        const match = result.content.match(/\[[\s\S]*\]/);
        if (match) {
            prompts = JSON.parse(match[0]);
        } else {
            throw new Error('Failed to parse image prompts');
        }
    }

    // Ensure we have the right number of prompts
    prompts = prompts.slice(0, numberOfImages);

    return { prompts };
}

/**
 * Call OpenRouter text generation API with retry logic
 */
async function callOpenRouterText(prompt, model, apiKey, maxTokens = 6000, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.post(
                OPENROUTER_API_URL,
                {
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert professional content writer, journalist, and SEO specialist with 15+ years of experience. You create engaging, well-researched, authoritative blog content. Always return valid JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: maxTokens,
                    response_format: { type: 'json_object' }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://apify.com',
                        'X-Title': 'Apify Professional Blog Writer',
                        'Content-Type': 'application/json'
                    },
                    timeout: 180000 // 3 minutes
                }
            );

            return {
                content: response.data.choices[0].message.content,
                usage: response.data.usage,
                model: response.data.model
            };

        } catch (error) {
            if (error.response?.status === 429) {
                const retryAfter = parseInt(error.response.headers['retry-after'] || '10');
                if (attempt < maxRetries) {
                    console.log(`  ⚠ Rate limited. Waiting ${retryAfter}s before retry ${attempt}/${maxRetries}...`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    continue;
                }
            }

            if (error.response?.status === 401) {
                throw new Error('Invalid OpenRouter API key. Get your key at https://openrouter.ai/keys');
            }

            if (error.response?.status >= 500 && attempt < maxRetries) {
                const backoff = Math.pow(2, attempt) * 1000;
                console.log(`  ⚠ Server error. Retrying in ${backoff}ms (attempt ${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                continue;
            }

            throw error;
        }
    }

    throw new Error(`Failed after ${maxRetries} attempts`);
}

/**
 * Call OpenRouter image generation API
 */
async function callOpenRouterImage(prompt, model, apiKey, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.post(
                OPENROUTER_IMAGE_URL,
                {
                    model: model,
                    prompt: prompt,
                    n: 1,
                    size: '1024x1024'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://apify.com',
                        'X-Title': 'Apify Professional Blog Writer',
                        'Content-Type': 'application/json'
                    },
                    timeout: 120000 // 2 minutes
                }
            );

            return response.data.data[0].url;

        } catch (error) {
            if (error.response?.status === 429) {
                const retryAfter = parseInt(error.response.headers['retry-after'] || '10');
                if (attempt < maxRetries) {
                    console.log(`  ⚠ Rate limited. Waiting ${retryAfter}s before retry ${attempt}/${maxRetries}...`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    continue;
                }
            }

            if (error.response?.status >= 500 && attempt < maxRetries) {
                const backoff = Math.pow(2, attempt) * 1000;
                console.log(`  ⚠ Server error. Retrying in ${backoff}ms (attempt ${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                continue;
            }

            throw error;
        }
    }

    throw new Error(`Failed to generate image after ${maxRetries} attempts`);
}

/**
 * Generate table of contents from HTML content
 */
function generateTableOfContents(html) {
    const toc = [];
    const h2Regex = /<h2[^>]*id=["']([^"']+)["'][^>]*>(.*?)<\/h2>/gi;
    let match;

    while ((match = h2Regex.exec(html)) !== null) {
        const anchor = match[1];
        const heading = match[2].replace(/<[^>]*>/g, '').trim();

        toc.push({
            heading,
            anchor
        });
    }

    // If no IDs found, create them from headings
    if (toc.length === 0) {
        const h2SimpleRegex = /<h2[^>]*>(.*?)<\/h2>/gi;
        let index = 1;

        while ((match = h2SimpleRegex.exec(html)) !== null) {
            const heading = match[1].replace(/<[^>]*>/g, '').trim();
            const anchor = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `section-${index}`;

            toc.push({
                heading,
                anchor
            });
            index++;
        }
    }

    return toc;
}

/**
 * Extract headings from HTML
 */
function extractHeadings(html) {
    const headings = [];
    const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
    let match;

    while ((match = headingRegex.exec(html)) !== null) {
        const heading = match[1].replace(/<[^>]*>/g, '').trim();
        headings.push(heading);
    }

    return headings;
}

/**
 * Convert HTML to Markdown
 */
function htmlToMarkdown(html) {
    let markdown = html;

    // Headers
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');

    // Paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n');

    // Strong/Bold
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

    // Emphasis/Italic
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Lists
    markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ol>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1');

    // Blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n> $1\n');

    // Links
    markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '');

    // Clean up whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

    return markdown;
}

/**
 * Calculate SEO score based on various factors
 */
function calculateSEOScore(options) {
    const {
        title,
        metaDescription,
        content,
        keywords,
        wordCount,
        hasImages,
        hasTOC
    } = options;

    let score = 0;
    const contentLower = content.toLowerCase();

    // Title optimization (15 points)
    if (title.length >= 50 && title.length <= 70) score += 10;
    else if (title.length >= 40 && title.length <= 80) score += 5;

    const titleLower = title.toLowerCase();
    if (keywords.some(kw => titleLower.includes(kw.toLowerCase()))) score += 5;

    // Meta description (10 points)
    if (metaDescription.length >= 150 && metaDescription.length <= 160) score += 10;
    else if (metaDescription.length >= 140 && metaDescription.length <= 170) score += 5;

    // Word count (15 points)
    if (wordCount >= 1500 && wordCount <= 3000) score += 15;
    else if (wordCount >= 1000 && wordCount <= 4000) score += 10;
    else if (wordCount >= 800) score += 5;

    // Keyword usage (20 points)
    let keywordScore = 0;
    keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        const occurrences = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
        const density = occurrences / (wordCount / 100); // Percentage

        // Optimal density: 0.5-2%
        if (density >= 0.5 && density <= 2) keywordScore += 5;
        else if (density >= 0.3 && density <= 3) keywordScore += 3;
        else if (occurrences > 0) keywordScore += 1;
    });
    score += Math.min(keywordScore, 20);

    // Heading structure (15 points)
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;

    if (h2Count >= 3 && h2Count <= 8) score += 10;
    else if (h2Count >= 2) score += 5;

    if (h3Count >= 2) score += 5;

    // Images (10 points)
    if (hasImages) score += 10;

    // Table of contents (5 points)
    if (hasTOC) score += 5;

    // List usage (5 points)
    const hasLists = /<[uo]l>/i.test(content);
    if (hasLists) score += 5;

    // Internal structure (5 points)
    const hasParagraphs = (content.match(/<p>/gi) || []).length >= 5;
    if (hasParagraphs) score += 5;

    return Math.min(score, 100);
}

/**
 * Calculate charge price based on article complexity
 */
function calculateChargePrice(wordCount, numberOfImages) {
    // Base price: $2.00 for basic article
    let price = 2.00;

    // Word count pricing
    if (wordCount >= 3000) price += 3.00;
    else if (wordCount >= 2000) price += 2.00;
    else if (wordCount >= 1500) price += 1.00;

    // Image pricing
    price += numberOfImages * 0.50;

    return parseFloat(price.toFixed(2));
}

/**
 * Calculate text generation cost
 */
function calculateTextCost(usage, model) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['anthropic/claude-3.5-sonnet'];

    const inputCost = (usage.prompt_tokens / 1000000) * pricing.input;
    const outputCost = (usage.completion_tokens / 1000000) * pricing.output;

    return {
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost
    };
}

/**
 * Count words in HTML content
 */
function countWords(html) {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.split(/\s+/).filter(word => word.length > 0).length;
}

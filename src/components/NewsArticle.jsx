import { useEffect, useState } from 'react'
import { getNewsArticle } from '../api/news'

export default function NewsArticle({ slug, back }) {
  const [article, setArticle] = useState(null); const [status, setStatus] = useState('loading')
  useEffect(() => { setStatus('loading'); getNewsArticle(slug).then(data => { setArticle(data); setStatus('ready') }).catch(() => setStatus('error')) }, [slug])
  return <main className="article-page"><button className="back" onClick={back}>← All stories</button>{status === 'loading' && <div className="state-card">Loading story…</div>}{status === 'error' && <div className="state-card">This story could not be loaded.</div>}{status === 'ready' && <article className="article"><p>{article.isFeatured ? 'FEATURED STORY · ' : ''}{new Date(article.publishedAt).toLocaleDateString()}</p><h1>{article.title}</h1><h2>{article.summary}</h2>{article.imageUrl && <img src={article.imageUrl} alt=""/>}<div className="article-content">{article.content.split(/\r?\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article>}</main>
}

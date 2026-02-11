import { getServerSideSitemap } from 'next-sitemap'
import { GetServerSideProps } from 'next'

export async function GET(request: Request) {
  // Return empty sitemap for now since we don't have dynamic content
  // This can be extended later if needed for server-generated pages
  return getServerSideSitemap(
    [],
    request.headers.get('host') ?? ''
  )
}

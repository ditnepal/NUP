import { BaseService } from './base.service';

export class CmsService extends BaseService {
  /**
   * Get all published pages
   */
  async getPages(language: string = 'en') {
    return await this.db.cmsPage.findMany({
      where: { status: 'PUBLISHED', language },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ]
    });
  }

  /**
   * Get a page by ID
   */
  async getPageById(id: string) {
    return await this.db.cmsPage.findFirst({
      where: { id, status: 'PUBLISHED' }
    });
  }

  /**
   * Get a page by slug
   */
  async getPageBySlug(slug: string, language: string = 'en') {
    return await this.db.cmsPage.findFirst({
      where: { slug, language, status: 'PUBLISHED' }
    });
  }

  /**
   * Get all published posts by type
   */
  async getPosts(type: string = 'NEWS', language: string = 'en', categoryId?: string) {
    const where: any = { status: 'PUBLISHED', type, language };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    return await this.db.cmsPost.findMany({
      where,
      include: { category: true, author: { select: { displayName: true } } },
      orderBy: [
        { isPinned: 'desc' },
        { publishedAt: 'desc' }
      ]
    });
  }

  /**
   * Get a post by ID
   */
  async getPostById(id: string) {
    return await this.db.cmsPost.findFirst({
      where: { id, status: 'PUBLISHED' },
      include: { category: true, author: { select: { displayName: true } } }
    });
  }

  /**
   * Get a post by slug
   */
  async getPostBySlug(slug: string, language: string = 'en') {
    return await this.db.cmsPost.findFirst({
      where: { slug, language, status: 'PUBLISHED' },
      include: { category: true, author: { select: { displayName: true } } }
    });
  }

  /**
   * Get all downloads
   */
  async getDownloads(category?: string) {
    return await this.db.cmsDownload.findMany({
      where: category ? { category } : {},
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get all media
   */
  async getMedia(type?: string) {
    return await this.db.cmsMedia.findMany({
      where: type ? { fileType: type } : {},
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Handle redirects
   */
  async getRedirect(fromPath: string) {
    return await this.db.cmsRedirect.findUnique({
      where: { fromPath }
    });
  }
}

export const cmsService = new CmsService();
